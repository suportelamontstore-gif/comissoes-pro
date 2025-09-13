"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CsvUploader from "../../../components/CsvUploader";
import { supabase } from "../../../lib/supabaseClient";

/* ---------- helpers para converter strings do CSV ---------- */

function parseBRNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim();
  if (!s) return 0;
  // remove "R$" e espaços
  s = s.replace(/R\$\s?/i, "").replace(/\s/g, "");
  // se tem '.' e ',', assume formato BR (1.234,56)
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // troca vírgula por ponto (10,5 -> 10.5)
    s = s.replace(",", ".");
  }
  // remove qualquer caractere não numérico exceto - e .
  s = s.replace(/[^0-9\.\-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDateFlexible(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  // tenta Date padrão
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;
  // tenta dd/mm/yyyy ou d/m/yyyy
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

/* ---------- findKey util para colunas com nomes diferentes ---------- */
function findKey(obj: Record<string, any>, candidates: string[]) {
  const keys = Object.keys(obj);
  const low = keys.reduce<Record<string,string>>((acc, k) => {
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

/* ---------- Dashboard component ---------- */
export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  // auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  // recebe os dados do uploader (array de objetos)
  function handleCsvRows(parsed: any[]) {
    setRows(parsed);
    // opcional: scroll para métricas
    const el = document.getElementById("metrics");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  // Deriva métricas (useMemo para performance)
  const metrics = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        dataInicio: null,
        dataFim: null,
        pedidosUnicos: 0,
        totalVendas: 0,
        diretas: 0,
        indiretas: 0,
        pedidosPorHora: new Map<number, number>(),
        subidAgg: [] as { nome: string; quantidade: number; comissao: number }[],
        canalAgg: [] as { nome: string; quantidade: number; comissao: number }[],
      };
    }

    // detectar nomes de colunas comuns
    const sample = rows[0] as Record<string, any>;
    const orderKey = findKey(sample, ["id do pedido", "id_pedido", "pedido", "order"]);
    const paymentKey = findKey(sample, ["id do pagamento", "id_pagamento", "payment"]);
    const dateKey = findKey(sample, ["horário do pedido", "horario", "date", "data", "order date"]);
    const valorKey = findKey(sample, ["valor", "valor de compra", "valor_compra", "value"]);
    const comissaoKey = findKey(sample, ["comissão", "comissao", "comissão líquida", "comissao líquida"]);
    const atribKey = findKey(sample, ["tipo de atribuição", "atribuição", "tipo"]);
    const subidKey = findKey(sample, ["sub_id1", "subid", "sub_id", "sub id"]);
    const canalKey = findKey(sample, ["canal", "channel", "source"]);

    const orderSet = new Set<string>();
    let totalVendas = 0;
    let diretas = 0;
    let indiretas = 0;
    let dataMin: Date | null = null;
    let dataMax: Date | null = null;
    const pedidosPorHora = new Map<number, number>();
    const subMap = new Map<string, { quantidade: number; comissao: number }>();
    const canalMap = new Map<string, { quantidade: number; comissao: number }>();

    for (const raw of rows) {
      const r = raw as Record<string, any>;

      // identificar pedido único por orderKey ou combinação order+payment
      const orderId = orderKey ? String(r[orderKey] ?? "") : "";
      const paymentId = paymentKey ? String(r[paymentKey] ?? "") : "";
      const uniqueId = orderId || paymentId || JSON.stringify(r);

      orderSet.add(uniqueId);

      // total vendas
      const valor = valorKey ? parseBRNumber(r[valorKey]) : 0;
      totalVendas += valor;

      // comissao
      const com = comissaoKey ? parseBRNumber(r[comissaoKey]) : 0;

      // diretas/indiretas
      const atrib = atribKey ? String(r[atribKey] ?? "").toLowerCase() : "";
      if (atrib.includes("mesma") || atrib.includes("direta") || atrib.includes("direct")) {
        diretas += 1;
      } else if (atrib.includes("diferen") || atrib.includes("indireta") || atrib.includes("indirect")) {
        indiretas += 1;
      }

      // data / hora
      const d = dateKey ? parseDateFlexible(r[dateKey]) : null;
      if (d) {
        if (!dataMin || d < dataMin) dataMin = d;
        if (!dataMax || d > dataMax) dataMax = d;
        const h = d.getHours();
        pedidosPorHora.set(h, (pedidosPorHora.get(h) ?? 0) + 1);
      }

      // agrupar sub_id
      const subName = subidKey ? String(r[subidKey] ?? "Sem Sub ID") : "Sem Sub ID";
      const curSub = subMap.get(subName) ?? { quantidade: 0, comissao: 0 };
      curSub.quantidade += 1;
      curSub.comissao += com;
      subMap.set(subName, curSub);

      // agrupar canal
      const canalName = canalKey ? String(r[canalKey] ?? "Outro") : "Outro";
      const curCan = canalMap.get(canalName) ?? { quantidade: 0, comissao: 0 };
      curCan.quantidade += 1;
      curCan.comissao += com;
      canalMap.set(canalName, curCan);
    }

    // transforma maps em arrays ordenados
    const subidAgg = Array.from(subMap.entries()).map(([nome, v]) => ({
      nome,
      quantidade: v.quantidade,
      comissao: v.comissao,
    })).sort((a,b)=>b.comissao - a.comissao);

    const canalAgg = Array.from(canalMap.entries()).map(([nome, v]) => ({
      nome,
      quantidade: v.quantidade,
      comissao: v.comissao,
    })).sort((a,b)=>b.comissao - a.comissao);

    return {
      dataInicio: dataMin,
      dataFim: dataMax,
      pedidosUnicos: orderSet.size,
      totalVendas,
      diretas,
      indiretas,
      pedidosPorHora,
      subidAgg,
      canalAgg,
    };
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
        <p className="mt-2 text-sm text-gray-400">Importe o CSV exportado da Shopee com os dados de pedidos/comissões.</p>
      </div>

      {/* métricas */}
      <section id="metrics" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-6 shadow text-white">
          <h3 className="text-sm font-semibold">Pedidos Únicos</h3>
          <p className="text-3xl font-bold">{metrics.pedidosUnicos}</p>
          <p className="text-xs opacity-80">
            {metrics.dataInicio ? `${metrics.dataInicio.toLocaleDateString()} → ${metrics.dataFim?.toLocaleDateString()}` : "Sem dados"}
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow">
          <h3 className="text-sm font-semibold text-gray-300">Total em Vendas</h3>
          <p className="text-3xl font-bold text-white">{metrics.totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p className="text-xs text-gray-400">Sem persistência (memória apenas)</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow">
          <h3 className="text-sm font-semibold text-gray-300">Diretas / Indiretas</h3>
          <p className="text-2xl font-bold text-white">{metrics.diretas} / {metrics.indiretas}</p>
        </div>
      </section>

      {/* gráfico placeholder */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h4 className="font-semibold mb-3">Pedidos por hora</h4>
        <div className="h-40 flex items-end gap-2">
          {/* render barras simples */}
          {Array.from({ length: 24 }).map((_, h) => {
            const value = metrics.pedidosPorHora.get(h) ?? 0;
            const height = Math.min(200, value * 12) + "px";
            return (
              <div key={h} className="flex-1 flex items-end">
                <div title={`Hora ${h}: ${value}`} className="w-full rounded bg-orange-500" style={{ height }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-4 shadow">
          <h4 className="font-semibold mb-3">🏷 Sub_id1 — Quantidade & Comissão</h4>
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-3 py-2">Sub_id1</th>
                  <th className="px-3 py-2">Quantidade</th>
                  <th className="px-3 py-2">Comissão (R$)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.subidAgg.map((s, i) => (
                  <tr key={i} className="border-b border-gray-700">
                    <td className="px-3 py-2 text-gray-200">{s.nome}</td>
                    <td className="px-3 py-2">{s.quantidade}</td>
                    <td className="px-3 py-2">{s.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {metrics.subidAgg.length === 0 && (
                  <tr><td colSpan={3} className="p-3 text-gray-400">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 shadow">
          <h4 className="font-semibold mb-3">📢 Canal — Quantidade & Comissão</h4>
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-3 py-2">Canal</th>
                  <th className="px-3 py-2">Quantidade</th>
                  <th className="px-3 py-2">Comissão (R$)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.canalAgg.map((c, i) => (
                  <tr key={i} className="border-b border-gray-700">
                    <td className="px-3 py-2 text-gray-200">{c.nome}</td>
                    <td className="px-3 py-2">{c.quantidade}</td>
                    <td className="px-3 py-2">{c.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {metrics.canalAgg.length === 0 && (
                  <tr><td colSpan={3} className="p-3 text-gray-400">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
