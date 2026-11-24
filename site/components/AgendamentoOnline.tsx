"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { dataMaxima, dataMinima, horariosDoDia } from "@/lib/agenda";
import type { Profissional, Servico } from "@/lib/tipos";
import { EVENTO_AGENDAR, linkWhatsapp, type DetalheAgendar } from "@/lib/util";

type Props = { servicos: Servico[]; profissionais: Profissional[] };
type Confirmacao = { codigo: string; whatsapp: string; mensagem: string };

// Formulário de pedido de agendamento:
// 1) grava o pedido no banco (POST /api/pedidos) e recebe um código;
// 2) oferece continuar a conversa com a profissional no WhatsApp, já com o código.
export default function AgendamentoOnline({ servicos, profissionais }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [profissional, setProfissional] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [armadilha, setArmadilha] = useState(""); // anti-robô: humanos não veem este campo

  const [ocupados, setOcupados] = useState<string[]>([]);
  const [versaoAgenda, setVersaoAgenda] = useState(0); // incrementar = buscar a agenda de novo
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<{ texto: string; campo?: string } | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const iniciadoEm = useRef(0);

  // Datas dependem do relógio do visitante: só são definidas no navegador.
  const [limites, setLimites] = useState<{ min: string; max: string }>();
  useEffect(() => {
    const min = dataMinima();
    setLimites({ min, max: dataMaxima() });
    setData(min);
    iniciadoEm.current = Date.now();
  }, []);

  const servicoAtual = servicos.find((s) => s.id === servico);
  const profsDoServico = servicoAtual ? profissionais.filter((p) => servicoAtual.profissionais.includes(p.id)) : profissionais;
  const horarios = useMemo(() => horariosDoDia(data), [data]);
  const livres = horarios.filter((h) => !ocupados.includes(h));

  // Busca na API os horários já ocupados sempre que data, serviço ou profissional mudam
  // (e quando versaoAgenda muda: após um conflito ou ao iniciar um novo pedido).
  useEffect(() => {
    if (!data || !horarios.length) return setOcupados([]);
    const controle = new AbortController();
    const params = new URLSearchParams({ data, servico, profissional });
    fetch(`/api/horarios?${params}`, { signal: controle.signal })
      .then((r) => r.json())
      .then((r: { ocupados?: string[] }) => setOcupados(r.ocupados ?? []))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setOcupados([]); // sem agenda, segue; a profissional confirma depois
      });
    return () => controle.abort();
  }, [data, servico, profissional, horarios.length, versaoAgenda]);

  // Mantém o horário selecionado sempre válido.
  useEffect(() => {
    if (!livres.includes(hora)) setHora(livres[0] ?? "");
  }, [livres, hora]);

  function mostrarAviso(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(null), 2400);
  }

  function trocarServico(id: string) {
    setServico(id);
    const atendem = servicos.find((s) => s.id === id)?.profissionais ?? [];
    if (id && !atendem.includes(profissional)) setProfissional(atendem.length === 1 ? atendem[0] : "");
  }

  // Cards de serviço e botões "Agendar com…" preenchem o formulário via evento.
  useEffect(() => {
    const aoAgendar = (e: Event) => {
      const { servico: s, profissional: p } = (e as CustomEvent<DetalheAgendar>).detail;
      const atendem = servicos.find((x) => x.id === s)?.profissionais ?? [];
      setServico(s);
      setProfissional(p ?? (atendem.length === 1 ? atendem[0] : ""));
      setConfirmacao(null);
      form.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      mostrarAviso(`${servicos.find((x) => x.id === s)?.nome ?? "Serviço"} escolhido no agendamento`);
    };
    window.addEventListener(EVENTO_AGENDAR, aoAgendar);
    return () => window.removeEventListener(EVENTO_AGENDAR, aoAgendar);
  }, [servicos]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!horarios.length) return setErro({ texto: "Não atendemos aos domingos. Escolha outra data.", campo: "data" });
    if (!livres.length) return setErro({ texto: "Não há horários livres nesse dia. Escolha outra data.", campo: "data" });

    setEnviando(true);
    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, telefone, servico, profissional, data, hora, observacoes: obs, consentimento,
          site: armadilha, iniciadoEm: iniciadoEm.current,
        }),
      });
      const json = await resposta.json().catch(() => ({}));
      if (!resposta.ok || !json.ok) {
        if (resposta.status === 409) setVersaoAgenda((v) => v + 1); // horário foi tomado: atualiza a lista
        setErro({ texto: json.erro ?? "Não foi possível enviar. Tente novamente.", campo: json.campo });
        if (json.campo) form.current?.querySelector<HTMLElement>(`[name="${json.campo}"]`)?.focus();
        return;
      }
      const prof = profissionais.find((p) => p.id === profissional);
      const dataLonga = new Date(`${data}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      const mensagem =
        `Olá! Sou ${nome.trim()} e fiz um pedido pelo site do Luminé (código ${json.codigo}).\n` +
        `Serviço: ${servicoAtual?.nome}${prof ? ` com ${prof.nome}` : ""}\nData: ${dataLonga}, às ${hora}.` +
        (obs.trim() ? `\nObs.: ${obs.trim()}` : "");
      setConfirmacao({ codigo: json.codigo, whatsapp: json.whatsapp, mensagem });
    } catch {
      setErro({ texto: "Sem conexão. Verifique sua internet e tente de novo." });
    } finally {
      setEnviando(false);
    }
  }

  function novoPedido() {
    setConfirmacao(null);
    setObs("");
    setVersaoAgenda((v) => v + 1);
    iniciadoEm.current = Date.now();
  }

  const erroEm = (campo: string) => (erro?.campo === campo ? true : undefined);

  return (
    <>
      <form className="agendar" ref={form} onSubmit={enviar} noValidate>
        <h3>Pedir agendamento</h3>

        {confirmacao ? (
          <div className="resumo" role="status">
            <p className="sobre">Pedido registrado</p>
            <p className="codigo">{confirmacao.codigo}</p>
            <p>
              Recebemos seu pedido. A profissional confirma o horário e combina os detalhes com você pelo WhatsApp.
              Para adiantar, mande a mensagem abaixo:
            </p>
            <pre>{confirmacao.mensagem}</pre>
            <div className="acoes">
              <a className="botao" href={linkWhatsapp(confirmacao.whatsapp, confirmacao.mensagem)} target="_blank" rel="noopener noreferrer">
                Conversar no WhatsApp
              </a>
              <button className="botao botao--linha" type="button" onClick={novoPedido}>Fazer outro pedido</button>
            </div>
          </div>
        ) : (
          <>
            <div className="duas">
              <div className="campo">
                <label htmlFor="nome">Seu nome</label>
                <input id="nome" name="nome" autoComplete="name" placeholder="Ex.: Ana Beatriz" value={nome} maxLength={80}
                  aria-invalid={erroEm("nome")} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="telefone">Seu WhatsApp</label>
                <input id="telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(85) 9 9999-9999"
                  value={telefone} maxLength={20} aria-invalid={erroEm("telefone")} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>
            <div className="duas">
              <div className="campo">
                <label htmlFor="servico">Serviço</label>
                <select id="servico" name="servico" value={servico} aria-invalid={erroEm("servico")} onChange={(e) => trocarServico(e.target.value)}>
                  <option value="">Escolha um serviço</option>
                  {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="prof">Profissional</label>
                <select id="prof" name="profissional" value={profissional} onChange={(e) => setProfissional(e.target.value)}>
                  <option value="">Sem preferência</option>
                  {profsDoServico.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="duas">
              <div className="campo">
                <label htmlFor="data">Data</label>
                <input id="data" name="data" type="date" min={limites?.min} max={limites?.max} value={data}
                  aria-invalid={erroEm("data")} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="hora">Horário</label>
                <select id="hora" name="hora" value={hora} disabled={!livres.length} aria-invalid={erroEm("hora")} onChange={(e) => setHora(e.target.value)}>
                  {!horarios.length && <option value="">Fechado neste dia</option>}
                  {horarios.length > 0 && !livres.length && <option value="">Dia sem horários livres</option>}
                  {horarios.map((h) => (
                    <option key={h} value={h} disabled={ocupados.includes(h)}>
                      {h}{ocupados.includes(h) ? " (ocupado)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="campo">
              <label htmlFor="obs">Observações</label>
              <textarea id="obs" name="observacoes" placeholder="Ex.: make para casamento às 16h, cabelo longo" value={obs} maxLength={500}
                onChange={(e) => setObs(e.target.value)} />
            </div>
            <p className="nota-horario">
              Precisa de outro horário ou de atendimento em casa? Algumas profissionais atendem fora do expediente:
              escreva nas observações ou fale direto com a profissional pelo WhatsApp.
            </p>

            {/* Campo-armadilha: invisível para pessoas, robôs costumam preencher. */}
            <input className="armadilha" type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={armadilha} onChange={(e) => setArmadilha(e.target.value)} />

            <label className="consentimento">
              <input type="checkbox" name="consentimento" checked={consentimento} aria-invalid={erroEm("consentimento")}
                onChange={(e) => setConsentimento(e.target.checked)} />
              <span>
                Concordo com o uso do meu nome e WhatsApp para a equipe responder este pedido, conforme o{" "}
                <a href="/privacidade" target="_blank">aviso de privacidade</a>.
              </span>
            </label>

            <p className="erro" role="alert">{erro?.texto}</p>
            <button className="botao" type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar pedido"}
            </button>
          </>
        )}
      </form>
      {/* Portal: a seção usa content-visibility, que prenderia o aviso fixo dentro dela. */}
      {aviso && createPortal(<div className="toast" role="status">{aviso}</div>, document.body)}
    </>
  );
}
