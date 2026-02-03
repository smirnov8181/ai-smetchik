import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const VERIFICATION_PRICE = 99000; // 990 руб. в копейках

// POST /api/verify/:id/pay — create Stripe payment for full report
export async function POST(
  _request: NextRequest,
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

  const { data: verification, error } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !verification) {
    return NextResponse.json(
      { error: "Verification not found" },
      { status: 404 }
    );
  }

  if (verification.is_paid) {
    return NextResponse.json({ already_paid: true });
  }

  if (verification.status !== "ready") {
    return NextResponse.json(
      { error: "Verification is not ready yet" },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "rub",
            product_data: {
              name: "Детальный отчёт проверки сметы",
              description: `Полный разбор ${verification.result?.items?.length || 0} позиций с рыночными ценами`,
            },
            unit_amount: VERIFICATION_PRICE,
          },
          quantity: 1,
        },
      ],
      metadata: {
        verification_id: id,
        user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/verify/${id}?paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/verify/${id}`,
    });

    // Save payment intent
    await supabase
      .from("verifications")
      .update({ payment_intent_id: session.id })
      .eq("id", id);

    return NextResponse.json({ checkout_url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}
