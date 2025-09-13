"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: "monthly" | "quarterly" | "semiannual") {
    try {
      setLoading(plan);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: "teste@teste.com", // futuramente pegamos o real
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redireciona para o Stripe
      } else {
        alert("Erro: " + data.error);
      }
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-blue-500">
          Comissões Pro 💥
        </h1>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl">
          Analise seus relatórios da Shopee em segundos.  
          Painel bonito, rápido e pronto para você vender mais.
        </p>
      </section>

      {/* Planos */}
      <section className="px-6 max-w-5xl mx-auto py-16 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Mensal",
            price: "R$29/mês",
            plan: "monthly" as const,
          },
          {
            title: "Trimestral",
            price: "R$79/trimestre",
            plan: "quarterly" as const,
          },
          {
            title: "Semestral",
            price: "R$149/semestre",
            plan: "semiannual" as const,
          },
        ].map(({ title, price, plan }) => (
          <div
            key={plan}
            className="bg-gray-900 rounded-xl p-6 shadow flex flex-col items-center"
          >
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-gray-400 mb-6">{price}</p>
            <button
              onClick={() => handleCheckout(plan)}
              disabled={loading === plan}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow w-full"
            >
              {loading === plan ? "Carregando..." : "Assinar agora 🚀"}
            </button>
          </div>
        ))}
      </section>

      {/* CTA final */}
      <section className="text-center py-20">
        <h2 className="text-2xl font-bold">
          Pronto para aumentar suas vendas?
        </h2>
        <button
          onClick={() => handleCheckout("monthly")}
          className="mt-6 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow"
        >
          Assinar agora 🚀
        </button>
      </section>
    </div>
  );
}
