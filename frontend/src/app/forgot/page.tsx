// src/app/forgot/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) setMsg(error.message);
      else setMsg("E-mail enviado. Verifique a caixa de entrada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Recuperar senha</h2>
        <form onSubmit={handleReset} className="space-y-3">
          <input
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
            placeholder="seu@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {msg && <p className="text-sm text-yellow-300">{msg}</p>}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 rounded bg-orange-600 hover:bg-orange-500" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
            <button type="button" onClick={() => router.push("/")} className="px-4 py-2 rounded bg-gray-700">
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
