"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { contato } from "@/content";
import { dataMaxima, dataMinima, horariosDoDia } from "@/lib/agenda";
import type { Profissional, Servico } from "@/lib/tipos";
import { EVENTO_AGENDAR, linkWhatsapp, type DetalheAgendar } from "@/lib/util";

type Props = { servicos: Servico[]; profissionais: Profissional[] };

// Pedido de agendamento por WhatsApp: a cliente preenche, o site monta a mensagem e
// abre a conversa com a profissional. Nada é gravado (veja lib/recursos.ts).
export default function Agendamento({ servicos, profissionais }: Props) {
  const [nome, setNome] = useState("");
  const [servico, setServico] = useState("");
  const [profissional, setProfissional] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState<{ mensagem: string; link: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  // Datas dependem do relógio do visitante: só são definidas no navegador.
  const [limites, setLimites] = useState<{ min: string; max: string }>();
  useEffect(() => {
    const min = dataMinima();
    setLimites({ min, max: dataMaxima() });
    setData(min);
  }, []);

  const servicoAtual = servicos.find((s) => s.id === servico);
  const profsDoServico = servicoAtual ? profissionais.filter((p) => servicoAtual.profissionais.includes(p.id)) : profissionais;
  const horarios = useMemo(() => horariosDoDia(data), [data]);
  useEffect(() => {
    if (!horarios.includes(hora)) setHora(horarios[0] ?? "");
  }, [horarios, hora]);

  function trocarServico(id: string) {
    setServico(id);
    const atendem = servicos.find((s) => s.id === id)?.profissionais ?? [];
    if (id && !atendem.includes(profissional)) setProfissional(atendem.length === 1 ? atendem[0] : "");
  }

  // Cards de serviço e botões "Agendar com…" preenchem o formulário via evento.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const aoAgendar = (e: Event) => {
      const { servico: s, profissional: p } = (e as CustomEvent<DetalheAgendar>).detail;
      const atendem = servicos.find((x) => x.id === s)?.profissionais ?? [];
      setServico(s);
      setProfissional(p ?? (atendem.length === 1 ? atendem[0] : ""));
      setPronto(null);
      form.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAviso(`${servicos.find((x) => x.id === s)?.nome ?? "Serviço"} escolhido no agendamento`);
      clearTimeout(timer);
      timer = setTimeout(() => setAviso(null), 2400);
    };
    window.addEventListener(EVENTO_AGENDAR, aoAgendar);
    return () => {
      window.removeEventListener(EVENTO_AGENDAR, aoAgendar);
      clearTimeout(timer);
    };
  }, [servicos]);

  /** WhatsApp de destino: a profissional escolhida (ou a única do serviço); senão, o do espaço. */
  function numeroDestino(): string {
    const id = profissional || (servicoAtual?.profissionais.length === 1 ? servicoAtual.profissionais[0] : "");
    return profissionais.find((p) => p.id === id)?.whatsapp || contato.whatsapp;
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("Escreva seu nome para a profissional saber quem está chamando.");
    if (!servico) return setErro("Escolha o serviço que você quer agendar.");
    if (!horarios.length) return setErro("Não atendemos aos domingos. Escolha outra data.");
    setErro("");

    const prof = profissionais.find((p) => p.id === profissional);
    const dataLonga = new Date(`${data}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const mensagem =
      `Olá! Sou ${nome.trim()} e vim pelo site do Luminé.\n` +
      `Gostaria de agendar: ${servicoAtual?.nome}${prof ? ` com ${prof.nome}` : ""}.\n` +
      `Data: ${dataLonga}, às ${hora}.` +
      (obs.trim() ? `\nObs.: ${obs.trim()}` : "");
    const link = linkWhatsapp(numeroDestino(), mensagem);
    setPronto({ mensagem, link });
    // Abre direto (é resposta a um clique, então o navegador permite); o botão abaixo serve de reserva.
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function copiar() {
    if (!pronto) return;
    try {
      await navigator.clipboard.writeText(pronto.mensagem);
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
          <input id="nome" autoComplete="name" placeholder="Ex.: Ana Beatriz" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="duas">
          <div className="campo">
            <label htmlFor="servico">Serviço</label>
            <select id="servico" value={servico} onChange={(e) => trocarServico(e.target.value)}>
              <option value="">Escolha um serviço</option>
              {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="prof">Profissional</label>
            <select id="prof" value={profissional} onChange={(e) => setProfissional(e.target.value)}>
              <option value="">Sem preferência</option>
              {profsDoServico.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="duas">
          <div className="campo">
            <label htmlFor="data">Data</label>
            <input id="data" type="date" min={limites?.min} max={limites?.max} value={data} onChange={(e) => setData(e.target.value)} />
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
          escreva nas observações. O horário é confirmado pela profissional no WhatsApp.
        </p>
        <p className="erro" role="alert">{erro}</p>
        <button className="botao" type="submit">Continuar no WhatsApp</button>

        {pronto && (
          <div className="resumo" role="status">
            <strong>Mensagem pronta</strong>
            <pre>{pronto.mensagem}</pre>
            <div className="acoes">
              <a className="botao" href={pronto.link} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>
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
