import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error("Missing stripe-signature header");

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 🎯 Captura checkout concluído
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    const lineItem = (session.line_items?.data[0] as any)?.price?.id;

    let plano: string | null = null;
    if (lineItem === process.env.STRIPE_PRICE_MONTHLY) plano = "MENSAL";
    if (lineItem === process.env.STRIPE_PRICE_QUARTERLY) plano = "TRIMESTRAL";
    if (lineItem === process.env.STRIPE_PRICE_SEMIANNUAL) plano = "SEMESTRAL";

    if (email && plano) {
      console.log(`✅ ${email} assinou plano ${plano}`);

      await supabase
        .from("profiles")
        .update({ plano })
        .eq("email", email);
    }
  }

  return NextResponse.json({ received: true });
}
