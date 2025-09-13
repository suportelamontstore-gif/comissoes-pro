// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Cadastro solicitado! Verifique o e-mail para confirmação (se seu projeto estiver configurado para confirmação por e-mail)."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Criar Conta</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
            placeholder="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
            placeholder="senha (mín. 6)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
            placeholder="confirme a senha"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {message && <p className="text-sm text-yellow-300">{message}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded bg-green-600 hover:bg-green-500 transition"
            >
              {loading ? "Cadastrando..." : "Criar conta"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
