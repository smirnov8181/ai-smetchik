import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

/**
 * Stripe webhook handler — US market only.
 * Handles one-time payments for:
 * - Verification reports ($9.99) — metadata.verification_id
 * - Full estimates ($4.99) — metadata.estimate_id
 *
 * Webhook URL to configure in Stripe dashboard:
 *   https://your-domain.com/api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 200 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const verificationId = session.metadata?.verification_id;
      const estimateId = session.metadata?.estimate_id;

      // One-time payment for verification report
      if (verificationId) {
        const { error } = await supabase
          .from("verifications")
          .update({
            is_paid: true,
            payment_intent_id: session.id,
          })
          .eq("id", verificationId);

        if (error) {
          console.error("Stripe webhook: failed to update verification:", error);
        } else {
          console.log(`Stripe webhook: verification ${verificationId} marked as paid`);
        }
      }

      // One-time payment for full estimate
      if (estimateId) {
        const { error } = await supabase
          .from("estimates")
          .update({
            is_paid: true,
            payment_intent_id: session.id,
          })
          .eq("id", estimateId);

        if (error) {
          console.error("Stripe webhook: failed to update estimate:", error);
        } else {
          console.log(`Stripe webhook: estimate ${estimateId} marked as paid`);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
