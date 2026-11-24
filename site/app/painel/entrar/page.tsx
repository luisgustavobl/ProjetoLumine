import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import FormAcao from "@/components/painel/FormAcao";
import { membroAtual, tamanhoDaEquipe } from "@/lib/sessao";
import { entrar } from "../acoes-auth";

export const metadata: Metadata = { title: "Entrar · Painel Luminé", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Confere o banco antes de mostrar o login. null = banco fora do ar. */
async function situacao(): Promise<"vazia" | "logado" | "entrar" | null> {
  try {
    if ((await tamanhoDaEquipe()) === 0) return "vazia";
    return (await membroAtual()) ? "logado" : "entrar";
  } catch (erro) {
    console.error("[painel/entrar] banco indisponível:", (erro as Error).message);
    return null;
  }
}

export default async function Entrar() {
  const estado = await situacao(); // redirect fica fora do try (ele funciona lançando uma exceção)
  if (estado === "vazia") redirect("/painel/primeiro-acesso");
  if (estado === "logado") redirect("/painel");
  if (estado === null) {
    return (
      <main className="p-entrada">
        <div className="p-cartao">
          <Logo className="logo-svg p-logo" />
          <h1>Painel indisponível</h1>
          <p className="nota">Não conseguimos falar com o banco de dados agora. Tente de novo em alguns minutos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-entrada">
      <div className="p-cartao">
        <Logo className="logo-svg p-logo" />
        <h1>Painel da equipe</h1>
        <FormAcao acao={entrar} rotulo="Entrar">
          <div className="campo">
            <label htmlFor="usuario">Usuário ou e-mail</label>
            <input id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" autoComplete="current-password" required />
          </div>
        </FormAcao>
        <p className="nota">Esqueceu a senha? Peça para quem administra o painel redefinir.</p>
      </div>
    </main>
  );
}
