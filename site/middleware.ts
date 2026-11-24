import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Roda antes das páginas do painel: renova o token de login (que expira) e
// manda quem não está logado para /painel/entrar.
export async function middleware(req: NextRequest) {
  let resposta = NextResponse.next({ request: req });

  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        resposta = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await db.auth.getUser();
  const rotaLivre = req.nextUrl.pathname.startsWith("/painel/entrar") || req.nextUrl.pathname.startsWith("/painel/primeiro-acesso");
  if (!data.user && !rotaLivre) {
    return NextResponse.redirect(new URL("/painel/entrar", req.url));
  }
  return resposta;
}

export const config = { matcher: ["/painel/:path*"] };
