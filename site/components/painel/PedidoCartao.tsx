"use client";

import { useState, useTransition } from "react";
import { definirProfissional, mudarStatusPedido, type StatusPedido } from "@/app/painel/(logado)/acoes-agenda";
import { dataPorExtenso, mensagemParaCliente } from "@/lib/mensagens";
import { linkWhatsapp } from "@/lib/util";

export type PedidoPainel = {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  servico: string;
  servicoId: string;
  profissionalId: string | null;
  profissional: string | null;
  data: string;
  hora: string;
  observacoes: string | null;
  status: StatusPedido;
};

type Props = { pedido: PedidoPainel; opcoesProfissional: { id: string; nome: string }[]; compacto?: boolean };

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pendente: "Pendente", confirmado: "Confirmado", recusado: "Recusado", cancelado: "Cancelado",
};

// Cartão de um pedido: dados da cliente, ações de status e resposta pelo WhatsApp.
export default function PedidoCartao({ pedido: p, opcoesProfissional, compacto = false }: Props) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const executar = (fn: () => Promise<{ erro?: string }>) =>
    iniciar(async () => {
      setErro(null);
      const r = await fn();
      if (r.erro) setErro(r.erro);
    });

  const mensagem = mensagemParaCliente(p.status, {
    nomeCliente: p.nome, codigo: p.codigo, servico: p.servico, profissional: p.profissional, data: p.data, hora: p.hora,
  });
  const telefoneVisivel = p.telefone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

  return (
    <article className={`p-pedido st-${p.status}${compacto ? " compacto" : ""}`} aria-busy={pendente}>
      <header>
        <strong>{p.hora}</strong>
        <span className="p-status">{ROTULO_STATUS[p.status]}</span>
      </header>
      <p className="p-pedido-nome">{p.nome}</p>
      <p className="p-pedido-info">
        {p.servico}
        {p.profissional ? ` · ${p.profissional}` : " · sem preferência"}
      </p>
      {!compacto && (
        <>
          <p className="p-pedido-info">
            {dataPorExtenso(p.data)} · {telefoneVisivel} · <code>{p.codigo}</code>
          </p>
          {p.observacoes && <p className="p-pedido-obs">“{p.observacoes}”</p>}
          {!p.profissionalId && opcoesProfissional.length > 0 && (
            <label className="p-inline">
              Atribuir a
              <select defaultValue="" disabled={pendente} onChange={(e) => e.target.value && executar(() => definirProfissional(p.id, e.target.value))}>
                <option value="">escolher…</option>
                {opcoesProfissional.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </label>
          )}
        </>
      )}
      <div className="p-acoes">
        {p.status === "pendente" && (
          <>
            <button className="botao" type="button" disabled={pendente} onClick={() => executar(() => mudarStatusPedido(p.id, "confirmado"))}>Confirmar</button>
            <button className="botao botao--linha" type="button" disabled={pendente} onClick={() => executar(() => mudarStatusPedido(p.id, "recusado"))}>Recusar</button>
          </>
        )}
        {p.status === "confirmado" && (
          <button className="botao botao--linha" type="button" disabled={pendente}
            onClick={() => confirm("Cancelar este agendamento confirmado?") && executar(() => mudarStatusPedido(p.id, "cancelado"))}>
            Cancelar
          </button>
        )}
        {(p.status === "recusado" || p.status === "cancelado") && (
          <button className="botao botao--linha" type="button" disabled={pendente} onClick={() => executar(() => mudarStatusPedido(p.id, "pendente"))}>Reabrir</button>
        )}
        <a className="botao botao--whats" href={linkWhatsapp(p.telefone, mensagem)} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </article>
  );
}
