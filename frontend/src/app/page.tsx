"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const router = useRouter();

  // 🔹 Se já estiver logado, redireciona pro painel
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/painel");
      }
    };

    checkSession();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) setMsg(error.message);
      else router.push("/painel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
        {/* 🔹 "Logo" tipográfica elegante */}
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
          Comissões Pro 💥
        </h1>

        <h2 className="text-xl font-semibold text-gray-100 mb-4 text-center">
          Entrar
        </h2>

        <form onSubmit={handleLogin} className="space-y-3">
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
            placeholder="senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {msg && <p className="text-sm text-yellow-300">{msg}</p>}

          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
            >
              Criar conta
            </button>
          </div>

          <div className="flex justify-between text-sm mt-2">
            <button
              type="button"
              onClick={() => router.push("/forgot")}
              className="text-gray-400 hover:text-gray-200"
            >
              Esqueceu a senha?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

