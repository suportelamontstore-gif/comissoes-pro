"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function SucessoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 px-6">
      <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold mb-4">Pagamento aprovado! 🎉</h1>
      <p className="text-lg text-gray-400 mb-8 text-center max-w-lg">
        Sua assinatura foi confirmada. Bem-vindo ao <span className="text-blue-400 font-semibold">Comissões Pro</span>!  
        Agora você já pode acessar o painel exclusivo para assinantes.
      </p>
      <button
        onClick={() => router.push("/painel")}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow"
      >
        Ir para o painel 🚀
      </button>
    </div>
  );
}
