import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createPayment as createYooKassaPayment } from "@/lib/payments/yookassa";
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

const ESTIMATE_PRICE_RUB = 490;
const ESTIMATE_PRICE_USD_CENTS = 499; // $4.99

/**
 * Determine market region from request.
 */
function getRegion(request: NextRequest): "ru" | "us" {
  const referer = request.headers.get("referer") || "";
  if (referer.includes("/us/")) return "us";
  return "ru";
}

// POST /api/estimates/:id/pay — create payment for full estimate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !estimate) {
    return NextResponse.json(
      { error: "Estimate not found" },
      { status: 404 }
    );
  }

  if (estimate.is_paid) {
    return NextResponse.json({ already_paid: true });
  }

  if (estimate.status !== "ready") {
    return NextResponse.json(
      { error: "Estimate is not ready yet" },
      { status: 400 }
    );
  }

  const region = getRegion(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sectionCount = estimate.result?.sections?.length || 0;

  try {
    // RU market → YooKassa
    if (region === "ru") {
      const payment = await createYooKassaPayment({
        amount: ESTIMATE_PRICE_RUB,
        description: `Полная смета на ремонт (${sectionCount} разделов)`,
        returnUrl: `${appUrl}/ru/dashboard/estimates/${id}?paid=true`,
        metadata: {
          estimate_id: id,
          payment_type: "estimate",
          user_id: user.id,
        },
        idempotencyKey: randomUUID(),
      });

      await supabase
        .from("estimates")
        .update({ payment_intent_id: payment.id })
        .eq("id", id);

      const confirmationUrl = payment.confirmation?.confirmation_url;
      if (!confirmationUrl) {
        throw new Error("YooKassa did not return confirmation URL");
      }

      return NextResponse.json({
        checkout_url: confirmationUrl,
        provider: "yookassa",
      });
    }

    // US market → Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Full Renovation Estimate",
              description: `Complete estimate with ${sectionCount} sections and all work items`,
            },
            unit_amount: ESTIMATE_PRICE_USD_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        estimate_id: id,
        user_id: user.id,
      },
      success_url: `${appUrl}/us/dashboard/estimates/${id}?paid=true`,
      cancel_url: `${appUrl}/us/dashboard/estimates/${id}`,
    });

    await supabase
      .from("estimates")
      .update({ payment_intent_id: session.id })
      .eq("id", id);

    return NextResponse.json({
      checkout_url: session.url,
      provider: "stripe",
    });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}
