import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENDAMENTO_ONLINE } from "@/lib/recursos";
import PedidoCartao, { type PedidoPainel } from "@/components/painel/PedidoCartao";
import { hojeEmFortaleza, somarDias } from "@/lib/agenda";
import { clienteSessao } from "@/lib/sessao";

type LinhaPedido = {
  id: string; codigo: string; nome: string; telefone: string; servico_id: string; profissional_id: string | null;
  data: string; hora: string; observacoes: string | null; status: PedidoPainel["status"];
};
type LinhaBloqueio = { id: string; profissional_id: string | null; data: string; hora_inicio: string | null; hora_fim: string | null; motivo: string | null };

/** Segunda-feira da semana que contém a data. */
function inicioDaSemana(dataIso: string): string {
  const dia = new Date(`${dataIso}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return somarDias(dataIso, dia === 0 ? -6 : 1 - dia);
}

const NOMES_DIA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// Agenda: pedidos pendentes no topo e, abaixo, o calendário da semana.
export default async function Agenda({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  if (!AGENDAMENTO_ONLINE) notFound(); // recurso desligado em lib/recursos.ts
  const { semana } = await searchParams;
  const hoje = hojeEmFortaleza();
  const inicio = inicioDaSemana(/^\d{4}-\d{2}-\d{2}$/.test(semana ?? "") ? semana! : hoje);
  const fim = somarDias(inicio, 6);

  const db = await clienteSessao();
  const [pendentes, daSemana, bloqueios, servicos, profissionais] = await Promise.all([
    db.from("pedidos").select("*").eq("status", "pendente").order("data").order("hora"),
    db.from("pedidos").select("*").in("status", ["pendente", "confirmado"]).gte("data", inicio).lte("data", fim).order("hora"),
    db.from("bloqueios").select("*").gte("data", inicio).lte("data", fim).order("hora_inicio"),
    db.from("servicos").select("id, nome, servico_profissional(profissional_id)"),
    db.from("profissionais").select("id, nome").order("ordem"),
  ]);
  const erro = pendentes.error ?? daSemana.error ?? bloqueios.error ?? servicos.error ?? profissionais.error;
  if (erro) throw new Error(erro.message); // mostrado pela página de erro do painel
  const listaPendentes = (pendentes.data ?? []) as LinhaPedido[];
  const listaServicos = servicos.data ?? [];
  const listaProfs = profissionais.data ?? [];

  const nomeServico = new Map(listaServicos.map((s) => [s.id, s.nome as string]));
  const nomeProf = new Map(listaProfs.map((p) => [p.id, p.nome as string]));
  const atendem = new Map(listaServicos.map((s) => [s.id, (s.servico_profissional as { profissional_id: string }[]).map((x) => x.profissional_id)]));

  const paraCartao = (l: LinhaPedido): PedidoPainel => ({
    id: l.id, codigo: l.codigo, nome: l.nome, telefone: l.telefone, servicoId: l.servico_id,
    servico: nomeServico.get(l.servico_id) ?? l.servico_id, profissionalId: l.profissional_id,
    profissional: l.profissional_id ? nomeProf.get(l.profissional_id) ?? null : null,
    data: l.data, hora: l.hora.slice(0, 5), observacoes: l.observacoes, status: l.status,
  });
  const opcoes = (servicoId: string) => (atendem.get(servicoId) ?? []).map((id) => ({ id, nome: nomeProf.get(id) ?? id }));

  const dias = Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));
  const pedidosSemana = ((daSemana.data ?? []) as LinhaPedido[]).map(paraCartao);
  const bloqueiosSemana = (bloqueios.data ?? []) as LinhaBloqueio[];
  const rotuloIntervalo = `${new Date(`${inicio}T12:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${new Date(`${fim}T12:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <>
      <header className="p-cab">
        <h1>Agenda</h1>
        <p className="nota">Confirme ou recuse os pedidos e responda a cliente pelo WhatsApp com a mensagem pronta.</p>
      </header>

      <section className="p-bloco">
        <h2>Pedidos pendentes <span className="p-badge">{listaPendentes.length}</span></h2>
        {listaPendentes.length === 0 ? (
          <p className="nota">Nenhum pedido aguardando resposta. 🎉</p>
        ) : (
          <div className="p-grade-pedidos">
            {listaPendentes.map((l) => (
              <PedidoCartao key={l.id} pedido={paraCartao(l)} opcoesProfissional={opcoes(l.servico_id)} />
            ))}
          </div>
        )}
      </section>

      <section className="p-bloco">
        <div className="p-semana-cab">
          <h2>Semana · {rotuloIntervalo}</h2>
          <nav className="p-semana-nav" aria-label="Trocar semana">
            <Link className="chip" href={`/painel/agenda?semana=${somarDias(inicio, -7)}`}>‹ Anterior</Link>
            <Link className="chip" href="/painel/agenda">Hoje</Link>
            <Link className="chip" href={`/painel/agenda?semana=${somarDias(inicio, 7)}`}>Próxima ›</Link>
          </nav>
        </div>
        <div className="p-semana">
          {dias.map((dia, i) => {
            const doDia = pedidosSemana.filter((p) => p.data === dia);
            const bloqs = bloqueiosSemana.filter((b) => b.data === dia);
            return (
              <div key={dia} className={`p-dia${dia === hoje ? " hoje" : ""}${i === 6 ? " fechado" : ""}`}>
                <h3>
                  <span>{NOMES_DIA[i]}</span> {dia.slice(8, 10)}/{dia.slice(5, 7)}
                </h3>
                {bloqs.map((b) => (
                  <p key={b.id} className="p-bloqueio">
                    🔒 {b.hora_inicio ? `${b.hora_inicio.slice(0, 5)}–${b.hora_fim?.slice(0, 5)}` : "Dia inteiro"}
                    {" · "}{b.profissional_id ? nomeProf.get(b.profissional_id) : "Todas"}
                    {b.motivo && <small> ({b.motivo})</small>}
                  </p>
                ))}
                {doDia.map((p) => (
                  <PedidoCartao key={p.id} pedido={p} opcoesProfissional={opcoes(p.servicoId)} compacto />
                ))}
                {!doDia.length && !bloqs.length && <p className="p-vazio">{i === 6 ? "Fechado" : "Livre"}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
