import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clienteAdmin } from "./supabase";

export { loginParaEmail } from "./credenciais";

export type Membro = { userId: string; nome: string; usuario: string; admin: boolean; profissionalId: string | null };

/**
 * Cliente do Supabase com a sessão da pessoa logada (cookies).
 * Respeita o RLS: só enxerga o que a equipe pode ver.
 */
export async function clienteSessao() {
  const loja = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {
          // Em Server Components os cookies são só leitura; o middleware renova a sessão.
        }
      },
    },
  });
}

/** Membro da equipe logado, ou null. */
export async function membroAtual(): Promise<Membro | null> {
  const db = await clienteSessao();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data } = await db.from("equipe").select("*").eq("user_id", auth.user.id).maybeSingle();
  if (!data) return null;
  return { userId: data.user_id, nome: data.nome, usuario: data.usuario, admin: data.admin, profissionalId: data.profissional_id };
}

/** Use no topo de páginas e ações do painel: sem login válido, manda para a tela de entrada. */
export async function exigirEquipe(): Promise<Membro> {
  const membro = await membroAtual();
  if (!membro) redirect("/painel/entrar");
  return membro;
}

/** Quantas pessoas existem na equipe (0 = ainda não houve o primeiro acesso). */
export async function tamanhoDaEquipe(): Promise<number> {
  const { count, error } = await clienteAdmin().from("equipe").select("user_id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
