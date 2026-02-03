import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  price_pro_monthly: { plan: "pro", limit: 30 },
  price_business_monthly: { plan: "business", limit: 999999 },
};

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
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const priceId = session.metadata?.price_id;
      const verificationId = session.metadata?.verification_id;

      // One-time payment for verification report
      if (verificationId) {
        await supabase
          .from("verifications")
          .update({ is_paid: true })
          .eq("id", verificationId);
        break;
      }

      // Subscription payment
      if (userId && priceId) {
        const planConfig = PLAN_LIMITS[priceId] || {
          plan: "pro",
          limit: 30,
        };

        await supabase
          .from("subscriptions")
          .update({
            plan: planConfig.plan,
            estimates_limit: planConfig.limit,
            estimates_used: 0,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            period_start: new Date().toISOString(),
            period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("user_id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          estimates_limit: 3,
          stripe_subscription_id: null,
          period_end: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null;
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            estimates_used: 0,
            period_start: new Date().toISOString(),
            period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
