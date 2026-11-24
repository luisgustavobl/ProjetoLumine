import { notFound } from "next/navigation";
import FormAcao, { BotaoEnviar } from "@/components/painel/FormAcao";
import { AGENDAMENTO_ONLINE } from "@/lib/recursos";
import { hojeEmFortaleza } from "@/lib/agenda";
import { dataPorExtenso } from "@/lib/mensagens";
import { clienteSessao } from "@/lib/sessao";
import { criarBloqueio, removerBloqueio } from "../acoes-bloqueios";

// Bloqueios: folgas, compromissos e feriados. O horário bloqueado some do formulário do site.
export default async function Bloqueios() {
  if (!AGENDAMENTO_ONLINE) notFound(); // recurso desligado em lib/recursos.ts
  const db = await clienteSessao();
  const hoje = hojeEmFortaleza();
  const [bloqueios, profissionais] = await Promise.all([
    db.from("bloqueios").select("*").gte("data", hoje).order("data").order("hora_inicio"),
    db.from("profissionais").select("id, nome").eq("ativo", true).order("ordem"),
  ]);
  if (bloqueios.error || profissionais.error) throw new Error((bloqueios.error ?? profissionais.error)!.message);
  const nome = new Map((profissionais.data ?? []).map((p) => [p.id, p.nome as string]));

  return (
    <>
      <header className="p-cab">
        <h1>Bloqueios de horário</h1>
        <p className="nota">Marque folgas, compromissos ou feriados. Os horários bloqueados deixam de aparecer no agendamento do site.</p>
      </header>

      <section className="p-bloco">
        <h2>Novo bloqueio</h2>
        <FormAcao acao={criarBloqueio} rotulo="Bloquear" limparAoSalvar>
          <div className="p-campos">
            <div className="campo">
              <label htmlFor="b-prof">Profissional</label>
              <select id="b-prof" name="profissional" defaultValue="">
                <option value="">Todas (espaço fechado)</option>
                {(profissionais.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="b-data">Data</label>
              <input id="b-data" name="data" type="date" min={hoje} required />
            </div>
            <div className="campo">
              <label htmlFor="b-ini">Das</label>
              <input id="b-ini" name="inicio" type="time" step={3600} defaultValue="09:00" />
            </div>
            <div className="campo">
              <label htmlFor="b-fim">Até</label>
              <input id="b-fim" name="fim" type="time" step={3600} defaultValue="12:00" />
            </div>
          </div>
          <label className="p-check"><input type="checkbox" name="dia_inteiro" /> Dia inteiro</label>
          <div className="campo">
            <label htmlFor="b-motivo">Motivo (opcional, só a equipe vê)</label>
            <input id="b-motivo" name="motivo" maxLength={120} placeholder="Ex.: curso, feriado, consulta médica" />
          </div>
        </FormAcao>
      </section>

      <section className="p-bloco">
        <h2>Próximos bloqueios</h2>
        {!bloqueios.data?.length ? (
          <p className="nota">Nenhum bloqueio marcado.</p>
        ) : (
          <ul className="p-lista">
            {bloqueios.data.map((b) => (
              <li key={b.id}>
                <span>
                  <strong>{dataPorExtenso(b.data)}</strong>
                  {" · "}{b.hora_inicio ? `${b.hora_inicio.slice(0, 5)}–${b.hora_fim.slice(0, 5)}` : "dia inteiro"}
                  {" · "}{b.profissional_id ? nome.get(b.profissional_id) : "todas"}
                  {b.motivo && <small> — {b.motivo}</small>}
                </span>
                <form action={removerBloqueio.bind(null, b.id)}>
                  <BotaoEnviar rotulo="Remover" className="botao botao--perigo botao--peq" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
