// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // cria client para checar sessão
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // se tentar acessar /painel e não estiver logado → manda pro login
  if (!session && req.nextUrl.pathname.startsWith("/painel")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// define quais rotas serão checadas pelo middleware
export const config = {
  matcher: ["/painel/:path*"],
};
