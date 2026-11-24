import type { Metadata } from "next";
import { SCRIPT_TEMA } from "@/components/painel/BotaoTema";
import PainelNav from "@/components/painel/PainelNav";
import { AGENDAMENTO_ONLINE } from "@/lib/recursos";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";
import { sair } from "../acoes-auth";

export const metadata: Metadata = { title: "Painel · Luminé Beauty Club", robots: { index: false } };
export const dynamic = "force-dynamic";

// Todas as páginas dentro de (logado) exigem login de alguém da equipe.
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const membro = await exigirEquipe();

  let pendentes = 0;
  if (AGENDAMENTO_ONLINE) {
    const db = await clienteSessao();
    const { count } = await db.from("pedidos").select("id", { count: "exact", head: true }).eq("status", "pendente");
    pendentes = count ?? 0;
  }

  return (
    <div className="p-app">
      {/* Aplica o tema escolhido no painel antes de desenhar a tela. */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <PainelNav nome={membro.nome} agendaLigada={AGENDAMENTO_ONLINE} pendentes={pendentes} sair={sair} />
      <main className="p-conteudo">{children}</main>
    </div>
  );
}
