"use client";

import { useRouter } from "next/navigation";

export default function Painel() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-100">
          Painel de Análises
        </h1>

        <div className="flex flex-col gap-6">
           <button
            onClick={() => router.push("/painel/vendas")}
            className="w-full py-3 px-6 rounded-xl font-semibold 
                       bg-green-600 hover:bg-green-500 transition-all 
                       shadow-lg hover:shadow-green-500/30"
          >
            Analisar Comissões da Shopee
          </button>

           <button
            onClick={() => router.push("/painel/cliques")}
            className="w-full py-3 px-6 rounded-xl font-semibold 
                       bg-orange-600 hover:bg-orange-500 transition-all 
                       shadow-lg hover:shadow-orange-500/30"
          >
            Analisar Cliques da Shopee
          </button>
        </div>
      </div>
    </div>
  );
}
