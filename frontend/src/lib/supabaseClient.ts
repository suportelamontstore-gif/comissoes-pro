// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  console.warn("Supabase: faltam variáveis de ambiente NEXT_PUBLIC_SUPABASE_*");
}

export const supabase = createClient(url, anonKey);
