"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function CanceladoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 px-6">
      <XCircle className="w-20 h-20 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold mb-4">Pagamento cancelado ❌</h1>
      <p className="text-lg text-gray-400 mb-8 text-center max-w-lg">
        Parece que você cancelou o processo de pagamento.  
        Não tem problema, você pode tentar novamente quando estiver pronto.
      </p>
      <button
        onClick={() => router.push("/")}
        className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold shadow"
      >
        Voltar para a página inicial
      </button>
    </div>
  );
}
