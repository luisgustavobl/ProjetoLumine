"use client";

import { useState } from "react";
import { profissionais, type ItemPreco, type Servico, type TabelaPreco } from "@/content";
import { atributosFoto, formatarDuracao, formatarPreco, menorPreco, pedirAgendamento } from "@/lib/util";
import Modal from "./Modal";

// Ilustração usada só pelo card de Cursos, que não tem foto.
const ARTE_CURSO =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e0cf"/><stop offset="1" stop-color="#c99f84"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="90" cy="110" r="70" fill="#fff" opacity=".2"/><rect x="40" y="150" width="220" height="130" rx="14" fill="#f6ede4" stroke="#5a3b2a" stroke-width="3"/>${[
      "#c98d7e", "#e8b4a8", "#b54a5a", "#a8735f", "#d9a98a", "#7f5539",
    ]
      .map((cor, i) => `<circle cx="${85 + (i % 3) * 65}" cy="${190 + Math.floor(i / 3) * 50}" r="18" fill="${cor}"/>`)
      .join("")}<path d="M45 120l160-85" stroke="#5a3b2a" stroke-width="8" stroke-linecap="round"/><path d="M205 35l26-13" stroke="#2b2b2b" stroke-width="12" stroke-linecap="round"/></svg>`
  );

const nomeDe = (id: string) => profissionais.find((p) => p.id === id)?.nome ?? id;

/** Agrupa os itens pela categoria, mantendo a ordem em que aparecem ("" = sem categoria). */
function agruparPorCategoria(itens: ItemPreco[]): [string, ItemPreco[]][] {
  const grupos = new Map<string, ItemPreco[]>();
  for (const item of itens) {
    const chave = item.categoria ?? "";
    grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
  }
  return [...grupos.entries()];
}

type Props = { servicos: Servico[]; tabelas: TabelaPreco[] };

// Cards de serviço; clicar abre a tabela de preços daquele serviço.
export default function Servicos({ servicos, tabelas }: Props) {
  const [aberto, setAberto] = useState<Servico | null>(null);
  const tabelasDe = (s: Servico) => tabelas.filter((t) => t.servicoId === s.id);
  const fechar = () => setAberto(null);

  return (
    <>
      <ul className="servicos">
        {servicos.map((s) => (
          <li key={s.id}>
            <button type="button" className="servico" onClick={() => setAberto(s)} aria-label={`${s.nome}: ver preços`}>
              {s.foto ? (
                <img {...atributosFoto(s.foto, "(max-width:980px) 62vw, 220px")} alt={s.nome} loading="lazy" decoding="async" />
              ) : (
                <img src={ARTE_CURSO} width={300} height={400} alt="Ilustração de paleta de maquiagem" loading="lazy" />
              )}
              <span className="servico-txt">
                <span className="servico-nome">{s.nome}</span>
                <span className="servico-desc">{s.descricao}</span>
                <span className="preco">{s.rotuloPreco ?? menorPreco(tabelasDe(s)) ?? "sob consulta"}</span>
                <span className="ver-precos">Ver preços</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal aberto={aberto !== null} aoFechar={fechar} rotulo={`Preços: ${aberto?.nome ?? ""}`}>
        {aberto && (
          <div className="form-box precos">
            <button className="x" type="button" onClick={fechar} aria-label="Fechar">×</button>
            <p className="sobre">Tabela de preços</p>
            <h3>{aberto.nome}</h3>
            {tabelasDe(aberto).length === 0 && <p className="nota">Valores sob consulta. Fale com a equipe.</p>}
            {tabelasDe(aberto).map((t, _, todas) => (
              <section key={t.id} className="tabela">
                <h4>
                  {/* Com uma tabela só, o título repetiria o nome do serviço. */}
                  {todas.length > 1 ? t.titulo : ""}
                  <small>com {t.profissionais.map(nomeDe).join(" & ")}</small>
                </h4>
                {agruparPorCategoria(t.itens).map(([categoria, itens]) => (
                  <div key={categoria || "geral"}>
                    {categoria && <p className="categoria-preco">{categoria}</p>}
                    <dl>
                      {itens.map((item) => (
                        <div key={item.nome} className="linha-preco">
                          <dt>
                            {item.nome}
                            {(item.duracaoMin || item.obs) && (
                              <small>{[item.duracaoMin && formatarDuracao(item.duracaoMin), item.obs].filter(Boolean).join(" · ")}</small>
                            )}
                          </dt>
                          <dd>{formatarPreco(item)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </section>
            ))}
            <p className="nota">O valor final pode variar conforme o caso e é combinado com a profissional.</p>
            <button
              className="botao"
              type="button"
              onClick={() => {
                pedirAgendamento({ servico: aberto.id });
                fechar();
              }}
            >
              Agendar {aberto.nome.toLowerCase()}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
