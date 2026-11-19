"use client";

import { useState } from "react";
import { atendePor, formacaoGleicy, type Foto, type Profissional, type ServicoId } from "@/content";
import { atributosFoto, pedirAgendamento } from "@/lib/util";
import Carrossel from "./Carrossel";
import Lightbox from "./Lightbox";
import Modal from "./Modal";

/** Primeiro serviço que a profissional atende (pré-selecionado ao clicar em "Agendar com…"). */
function servicoPrincipal(id: Profissional["id"]): ServicoId {
  const achado = (Object.keys(atendePor) as ServicoId[]).find((s) => atendePor[s].includes(id));
  return achado ?? "makes";
}

export default function Profissionais({ lista }: { lista: Profissional[] }) {
  const [lightbox, setLightbox] = useState<{ fotos: Foto[]; inicio: number } | null>(null);
  const [formacaoAberta, setFormacaoAberta] = useState(false);

  return (
    <>
      <div className="profs">
        {lista.map((p) => (
          <article key={p.id} className="prof">
            <div className="prof-info">
              <img className="prof-foto" {...atributosFoto(p.retrato, "(max-width:860px) 92vw, 360px")} alt="" loading="lazy" decoding="async" />
              <div>
                <p className="sobre">{p.especialidade}</p>
                <h3>{p.nome}</h3>
              </div>
              <p className="txt">{p.sobre}</p>
              <a className="insta" href={`https://www.instagram.com/${p.instagram}/`} target="_blank" rel="noopener noreferrer">
                @{p.instagram} ↗
              </a>
              <ul className="tags">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="prof-acoes">
                <button className="botao" type="button" onClick={() => pedirAgendamento({ servico: servicoPrincipal(p.id), profissional: p.id })}>
                  Agendar com {p.nome.split(" ")[0]}
                </button>
                {p.temFormacao && (
                  <button className="botao botao--linha" type="button" onClick={() => setFormacaoAberta(true)}>
                    Ver formação
                  </button>
                )}
              </div>
            </div>
            <Carrossel fotos={p.fotos} titulo={p.nome} aoAbrir={(i) => setLightbox({ fotos: p.fotos, inicio: i })} />
          </article>
        ))}
      </div>

      <Lightbox fotos={lightbox?.fotos ?? []} inicio={lightbox?.inicio ?? null} aoFechar={() => setLightbox(null)} />

      <Modal aberto={formacaoAberta} aoFechar={() => setFormacaoAberta(false)} rotulo="Formação profissional de Gleicy Lima">
        <div className="form-box">
          <button className="x" type="button" onClick={() => setFormacaoAberta(false)} aria-label="Fechar">×</button>
          <p className="sobre">Gleicy Lima</p>
          <h3>Formação profissional</h3>
          <p className="nota">Cursos e workshops que fazem parte da trajetória da Gleicy, especialista em realçar beleza desde 2013.</p>
          <ul className="formacao">
            {formacaoGleicy.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
