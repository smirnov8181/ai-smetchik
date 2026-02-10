import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaymentFromWebhook } from "@/lib/payments/yookassa";

/**
 * YooKassa webhook handler.
 *
 * Handles payments for both:
 * - Verification reports (990 RUB) — metadata.payment_type = "verification"
 * - Full estimates (490 RUB) — metadata.payment_type = "estimate"
 *
 * Webhook URL to configure in YooKassa dashboard:
 *   https://your-domain.com/api/webhooks/yookassa
 *
 * Events to subscribe: payment.succeeded, payment.canceled
 */

// Use service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface YooKassaWebhookBody {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    metadata?: {
      verification_id?: string;
      estimate_id?: string;
      payment_type?: string;
      user_id?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as YooKassaWebhookBody;

    // We only care about payment.succeeded
    if (body.event !== "payment.succeeded") {
      return NextResponse.json({ status: "ignored", event: body.event });
    }

    const paymentId = body.object?.id;
    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    // Verify payment by fetching it from YooKassa API directly
    const { verified, payment } = await verifyPaymentFromWebhook(paymentId);

    if (!verified) {
      console.warn(
        `YooKassa webhook: payment ${paymentId} not verified (status: ${payment.status})`
      );
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 }
      );
    }

    const metadata = payment.metadata as YooKassaWebhookBody["object"]["metadata"];
    const paymentType = metadata?.payment_type;

    // Handle estimate payments
    if (paymentType === "estimate" && metadata?.estimate_id) {
      const { error: updateError } = await supabase
        .from("estimates")
        .update({
          is_paid: true,
          payment_intent_id: paymentId,
        })
        .eq("id", metadata.estimate_id);

      if (updateError) {
        console.error("YooKassa webhook: failed to update estimate:", updateError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(
        `YooKassa webhook: estimate ${metadata.estimate_id} marked as paid (payment: ${paymentId})`
      );
      return NextResponse.json({ status: "ok", estimate_id: metadata.estimate_id });
    }

    // Handle verification payments (default / legacy)
    const verificationId = metadata?.verification_id;
    if (!verificationId) {
      console.warn(
        `YooKassa webhook: payment ${paymentId} has no verification_id or estimate_id`
      );
      return NextResponse.json(
        { error: "Missing entity ID in metadata" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("verifications")
      .update({
        is_paid: true,
        payment_intent_id: paymentId,
      })
      .eq("id", verificationId);

    if (updateError) {
      console.error("YooKassa webhook: failed to update verification:", updateError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log(
      `YooKassa webhook: verification ${verificationId} marked as paid (payment: ${paymentId})`
    );
    return NextResponse.json({ status: "ok", verification_id: verificationId });
  } catch (err) {
    console.error("YooKassa webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
