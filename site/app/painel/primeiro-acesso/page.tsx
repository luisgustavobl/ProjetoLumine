import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import FormAcao from "@/components/painel/FormAcao";
import { tamanhoDaEquipe } from "@/lib/sessao";
import { criarPrimeiroAdmin } from "../acoes-auth";

export const metadata: Metadata = { title: "Primeiro acesso · Painel Luminé", robots: { index: false } };
export const dynamic = "force-dynamic";

// Só existe enquanto não há ninguém na equipe: cria a conta de quem administra o painel.
export default async function PrimeiroAcesso() {
  if ((await tamanhoDaEquipe()) > 0) redirect("/painel/entrar");

  return (
    <main className="p-entrada">
      <div className="p-cartao">
        <Logo className="logo-svg p-logo" />
        <h1>Primeiro acesso</h1>
        <p className="nota">
          Crie a conta de administração do painel. Depois, por ela, você cadastra o restante da equipe.
        </p>
        <FormAcao acao={criarPrimeiroAdmin} rotulo="Criar conta e entrar">
          <div className="campo">
            <label htmlFor="nome">Seu nome</label>
            <input id="nome" name="nome" autoComplete="name" required />
          </div>
          <div className="campo">
            <label htmlFor="usuario">Usuário</label>
            <input id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" placeholder="ex.: luis" required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha (mínimo 8 caracteres)</label>
            <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="campo">
            <label htmlFor="confirmacao">Repita a senha</label>
            <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" minLength={8} required />
          </div>
        </FormAcao>
      </div>
    </main>
  );
}
