import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia", // versão estável
});

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json();

    let priceId: string | undefined;

    if (plan === "monthly") priceId = process.env.STRIPE_PRICE_MONTHLY;
    if (plan === "quarterly") priceId = process.env.STRIPE_PRICE_QUARTERLY;
    if (plan === "semiannual") priceId = process.env.STRIPE_PRICE_SEMIANNUAL;

    if (!priceId) {
      return NextResponse.json(
        { error: "Plano inválido ou não configurado" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancelado`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Erro no checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
