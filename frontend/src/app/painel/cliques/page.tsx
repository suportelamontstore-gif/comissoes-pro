"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CsvUploader from "../../../components/CsvUploader";
import { supabase } from "../../../lib/supabaseClient";

/* ---------- utils ---------- */
function parseDateFlexible(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let day = parseInt(m[1], 10);
    let month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d2 = new Date(year, month, day);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}

function findKey(obj: Record<string, any>, candidates: string[]) {
  const keys = Object.keys(obj);
  const low = keys.reduce<Record<string, string>>((acc, k) => {
    acc[k.toLowerCase()] = k;
    return acc;
  }, {});
  for (const c of candidates) {
    for (const k of Object.keys(low)) {
      if (k.includes(c.toLowerCase())) return low[k];
    }
  }
  return undefined;
}

/* ---------- page ---------- */
export default function CliquesPage() {
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  function handleCsvRows(parsed: any[]) {
    setRows(parsed);
    const el = document.getElementById("metrics");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const metrics = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        totalCliques: 0,
        porHora: new Map<number, number>(),
        porSubid: [] as { nome: string; quantidade: number }[],
        canalAgg: [] as { nome: string; quantidade: number }[],
      };
    }

    const sample = rows[0] as Record<string, any>;
    const timeKey = findKey(sample, ["tempo", "hora", "time", "timestamp"]);
    const subidKey = findKey(sample, ["sub_id", "subid"]);
    const canalKey = findKey(sample, ["referenciador", "canal", "source", "referrer"]);

    let totalCliques = 0;
    const porHora = new Map<number, number>();
    const subMap = new Map<string, number>();
    const canalMap = new Map<string, number>();

    for (const raw of rows) {
      const r = raw as Record<string, any>;
      totalCliques++;

      // hora
      const d = timeKey ? parseDateFlexible(r[timeKey]) : null;
      if (d) {
        const h = d.getHours();
        porHora.set(h, (porHora.get(h) ?? 0) + 1);
      }

      // subid
      const subName = subidKey ? String(r[subidKey] ?? "Sem Sub ID") : "Sem Sub ID";
      subMap.set(subName, (subMap.get(subName) ?? 0) + 1);

      // canal
      const canalName = canalKey ? String(r[canalKey] ?? "Outro") : "Outro";
      canalMap.set(canalName, (canalMap.get(canalName) ?? 0) + 1);
    }

    const porSubid = Array.from(subMap.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const canalAgg = Array.from(canalMap.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return { totalCliques, porHora, porSubid, canalAgg };
  }, [rows]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6 space-y-6">
      {/* header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🖱 Análise de Cliques</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => router.push("/painel")}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Voltar
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
          >
            Sair
          </button>
        </div>
      </header>

      {/* uploader */}
      <div className="bg-gray-800 rounded-xl p-4">
        <CsvUploader onData={handleCsvRows} />
        <p className="mt-2 text-sm text-gray-400">
          Importe o CSV exportado da Shopee com os dados de cliques.
        </p>
      </div>

      {/* métricas */}
      <section id="metrics" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 shadow text-white">
          <h3 className="text-sm font-semibold">Total de Cliques</h3>
          <p className="text-4xl font-bold">{metrics.totalCliques}</p>
        </div>
      </section>

      {/* cards de horários */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h4 className="font-semibold mb-3">🕒 Cliques por Hora</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from(metrics.porHora.entries())
            .sort((a, b) => b[1] - a[1]) // desc pelo número de cliques
            .map(([h, value], idx) => {
              const destaque = idx < 3; // top 3
              return (
                <div
                  key={h}
                  className={`rounded-lg p-4 flex flex-col shadow transition 
                    ${
                      destaque
                        ? "bg-green-700 shadow-green-500/40 scale-105"
                        : "bg-gray-900 hover:bg-gray-700"
                    }`}
                >
                  <span className="text-sm text-gray-300">
                    {String(h).padStart(2, "0")}:00 - {String(h).padStart(2, "0")}:59
                  </span>
                  <span className="text-lg font-bold text-white">
                    {value} cliques
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sub_id */}
        <div className="bg-gray-800 rounded-xl p-4 shadow">
          <h4 className="font-semibold mb-3">🏷 Sub_id — Cliques</h4>
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-3 py-2">Sub_id</th>
                <th className="px-3 py-2">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {metrics.porSubid.map((s, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="px-3 py-2 text-gray-200">{s.nome}</td>
                  <td className="px-3 py-2">{s.quantidade}</td>
                </tr>
              ))}
              {metrics.porSubid.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-3 text-gray-400">
                    Sem dados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Canal */}
        <div className="bg-gray-800 rounded-xl p-4 shadow">
          <h4 className="font-semibold mb-3">📢 Cliques por Canal</h4>
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-3 py-2">Canal</th>
                  <th className="px-3 py-2">Cliques</th>
                </tr>
              </thead>
              <tbody>
                {metrics.canalAgg.map((c, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-700 ${
                      i < 3 ? "bg-green-900/40" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-200">{c.nome}</td>
                    <td className="px-3 py-2 font-bold">{c.quantidade}</td>
                  </tr>
                ))}
                {metrics.canalAgg.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-3 text-gray-400">
                      Sem dados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
