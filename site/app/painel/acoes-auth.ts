"use server";

import { redirect } from "next/navigation";
import { problemaNasCredenciais } from "@/lib/credenciais";
import { clienteSessao, loginParaEmail, tamanhoDaEquipe } from "@/lib/sessao";
import { clienteAdmin } from "@/lib/supabase";

export type EstadoForm = { erro?: string; ok?: string };

const campo = (form: FormData, nome: string) => String(form.get(nome) ?? "").trim();

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = campo(form, "usuario");
  const senha = String(form.get("senha") ?? "");
  if (!usuario || !senha) return { erro: "Preencha usuário e senha." };

  try {
    const db = await clienteSessao();
    const { error } = await db.auth.signInWithPassword({ email: loginParaEmail(usuario), password: senha });
    if (error) return { erro: "Usuário ou senha incorretos." };
    const { data } = await db.auth.getUser();
    const { data: membro } = await db.from("equipe").select("user_id").eq("user_id", data.user!.id).maybeSingle();
    if (!membro) {
      await db.auth.signOut();
      return { erro: "Esta conta não tem acesso ao painel." };
    }
  } catch (erro) {
    console.error("[painel/entrar]", (erro as Error).message);
    return { erro: "Não foi possível entrar agora. Tente de novo." };
  }
  redirect("/painel");
}

export async function sair() {
  const db = await clienteSessao();
  await db.auth.signOut();
  redirect("/painel/entrar");
}

/** Cria a primeira conta (administradora). Só funciona enquanto a equipe estiver vazia. */
export async function criarPrimeiroAdmin(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const nome = campo(form, "nome");
  const usuario = campo(form, "usuario").toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (nome.length < 2) return { erro: "Escreva seu nome." };
  const problema = problemaNasCredenciais(usuario, senha);
  if (problema) return { erro: problema };
  if (senha !== String(form.get("confirmacao") ?? "")) return { erro: "As senhas não conferem." };

  try {
    if ((await tamanhoDaEquipe()) > 0) return { erro: "O primeiro acesso já foi feito. Entre com sua conta." };
    const admin = clienteAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: loginParaEmail(usuario), password: senha, email_confirm: true, user_metadata: { nome },
    });
    if (error) return { erro: `Não foi possível criar a conta: ${error.message}` };
    const { error: erroEquipe } = await admin.from("equipe").insert({ user_id: data.user.id, nome, usuario, admin: true });
    if (erroEquipe) {
      await admin.auth.admin.deleteUser(data.user.id); // desfaz para não deixar conta órfã
      return { erro: `Não foi possível registrar na equipe: ${erroEquipe.message}` };
    }
    const db = await clienteSessao();
    await db.auth.signInWithPassword({ email: loginParaEmail(usuario), password: senha });
  } catch (erro) {
    console.error("[painel/primeiro-acesso]", (erro as Error).message);
    return { erro: "Algo deu errado ao criar a conta. Tente de novo." };
  }
  redirect("/painel");
}
