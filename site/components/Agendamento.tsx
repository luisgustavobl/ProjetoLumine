"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { atendePor, contato, funcionamento, profissionais, servicos, type ServicoId } from "@/content";
import { EVENTO_AGENDAR, linkWhatsapp, type DetalheAgendar } from "@/lib/util";

const isoDe = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDe(d);
}

/** Horários de início disponíveis na data (vazio se o salão fecha nesse dia). */
function horariosDo(dataIso: string): string[] {
  const dia = new Date(`${dataIso}T12:00`).getDay();
  if (!dataIso || Number.isNaN(dia) || funcionamento.diasFechados.includes(dia)) return [];
  const horas: string[] = [];
  for (let h = funcionamento.primeiraHora; h <= funcionamento.ultimaHora; h++) horas.push(`${String(h).padStart(2, "0")}:00`);
  return horas;
}

// Formulário de pedido de agendamento. Monta a mensagem e abre o WhatsApp da profissional.
// (Na fase do backend, o pedido também é gravado no banco antes de abrir o WhatsApp.)
export default function Agendamento() {
  const [nome, setNome] = useState("");
  const [servico, setServico] = useState<ServicoId | "">("");
  const [profissional, setProfissional] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  // A data mínima depende do relógio do visitante, então só é definida no navegador.
  const [dataMinima, setDataMinima] = useState<string>();
  useEffect(() => {
    const d = amanha();
    setDataMinima(d);
    setData(d);
  }, []);

  const horarios = useMemo(() => horariosDo(data), [data]);
  useEffect(() => {
    if (!horarios.includes(hora)) setHora(horarios[0] ?? "");
  }, [horarios, hora]);

  const profsDoServico = servico ? profissionais.filter((p) => atendePor[servico].includes(p.id)) : profissionais;

  // Cards de serviço e botões "Agendar com…" preenchem o formulário via evento.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const aoAgendar = (e: Event) => {
      const { servico: s, profissional: p } = (e as CustomEvent<DetalheAgendar>).detail;
      const sid = s as ServicoId;
      setServico(sid);
      setProfissional(p ?? (atendePor[sid]?.length === 1 ? atendePor[sid][0] : ""));
      setMensagem(null);
      form.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAviso(`${servicos.find((x) => x.id === sid)?.nome ?? "Serviço"} escolhido no agendamento`);
      clearTimeout(timer);
      timer = setTimeout(() => setAviso(null), 2400);
    };
    window.addEventListener(EVENTO_AGENDAR, aoAgendar);
    return () => {
      window.removeEventListener(EVENTO_AGENDAR, aoAgendar);
      clearTimeout(timer);
    };
  }, []);

  function trocarServico(s: ServicoId | "") {
    setServico(s);
    if (s && !(atendePor[s] as string[]).includes(profissional)) setProfissional(atendePor[s].length === 1 ? atendePor[s][0] : "");
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("Escreva seu nome para a equipe saber quem está chamando.");
    if (!servico) return setErro("Escolha o serviço que você quer agendar.");
    if (!horarios.length) return setErro("Não atendemos aos domingos. Escolha outra data.");
    setErro("");
    const prof = profissionais.find((p) => p.id === profissional);
    const nomeServico = servicos.find((s) => s.id === servico)?.nome;
    const dataLonga = new Date(`${data}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    setMensagem(
      `Olá! Sou ${nome.trim()} e vim pelo site do Luminé.\nGostaria de agendar: ${nomeServico}${prof ? ` com ${prof.nome}` : ""}.\nData: ${dataLonga}, às ${hora}.` +
        (obs.trim() ? `\nObs.: ${obs.trim()}` : "")
    );
  }

  async function copiar() {
    if (!mensagem) return;
    try {
      await navigator.clipboard.writeText(mensagem);
      setAviso("Mensagem copiada");
    } catch {
      setAviso("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
    setTimeout(() => setAviso(null), 2400);
  }

  return (
    <>
      <form className="agendar" ref={form} onSubmit={enviar} noValidate>
        <h3>Pedir agendamento</h3>
        <div className="campo">
          <label htmlFor="nome">Seu nome</label>
          <input id="nome" autoComplete="name" enterKeyHint="next" placeholder="Ex.: Ana Beatriz" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="duas">
          <div className="campo">
            <label htmlFor="servico">Serviço</label>
            <select id="servico" value={servico} onChange={(e) => trocarServico(e.target.value as ServicoId | "")}>
              <option value="">Escolha um serviço</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="prof">Profissional</label>
            <select id="prof" value={profissional} onChange={(e) => setProfissional(e.target.value)}>
              <option value="">Sem preferência</option>
              {profsDoServico.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="duas">
          <div className="campo">
            <label htmlFor="data">Data</label>
            <input id="data" type="date" min={dataMinima} value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="hora">Horário</label>
            <select id="hora" value={hora} disabled={!horarios.length} onChange={(e) => setHora(e.target.value)}>
              {horarios.length ? horarios.map((h) => <option key={h} value={h}>{h}</option>) : <option value="">Fechado neste dia</option>}
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="obs">Observações</label>
          <textarea id="obs" placeholder="Ex.: make para casamento às 16h, cabelo longo" value={obs} maxLength={500} onChange={(e) => setObs(e.target.value)} />
        </div>
        <p className="nota-horario">
          Precisa de outro horário ou de atendimento em casa? Algumas profissionais atendem fora do expediente:
          escreva nas observações ou fale direto com a profissional pelo WhatsApp.
        </p>
        <p className="erro" role="alert">{erro}</p>
        <button className="botao" type="submit">Montar mensagem</button>

        {mensagem && (
          <div className="resumo">
            <strong>Mensagem pronta para o WhatsApp</strong>
            <pre>{mensagem}</pre>
            <div className="acoes">
              <a className="botao" href={linkWhatsapp(contato.whatsapp, mensagem)} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>
              <button className="botao botao--linha" type="button" onClick={copiar}>Copiar mensagem</button>
            </div>
          </div>
        )}
      </form>
      {/* Portal: a seção usa content-visibility, que prenderia o aviso fixo dentro dela. */}
      {aviso && createPortal(<div className="toast" role="status">{aviso}</div>, document.body)}
    </>
  );
}
