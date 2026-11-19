"use client";

import { useState } from "react";
import type { Foto, Profissional, Servico } from "@/lib/tipos";
import { pedirAgendamento } from "@/lib/util";
import Carrossel from "./Carrossel";
import Lightbox from "./Lightbox";
import Modal from "./Modal";

type Props = { lista: Profissional[]; servicos: Servico[] };

export default function Profissionais({ lista, servicos }: Props) {
  const [lightbox, setLightbox] = useState<{ fotos: Foto[]; inicio: number } | null>(null);
  const [formacao, setFormacao] = useState<Profissional | null>(null);

  /** Primeiro serviço que a profissional atende (pré-selecionado em "Agendar com…"). */
  const servicoPrincipal = (id: string) => servicos.find((s) => s.profissionais.includes(id))?.id ?? servicos[0]?.id ?? "";

  return (
    <>
      <div className="profs">
        {lista.map((p) => (
          <article key={p.id} className="prof">
            <div className="prof-info">
              {p.retratoUrl && <img className="prof-foto" src={p.retratoUrl} alt="" loading="lazy" decoding="async" />}
              <div>
                <p className="sobre">{p.especialidade}</p>
                <h3>{p.nome}</h3>
              </div>
              <p className="txt">{p.sobre}</p>
              {p.instagram && (
                <a className="insta" href={`https://www.instagram.com/${p.instagram}/`} target="_blank" rel="noopener noreferrer">
                  @{p.instagram} ↗
                </a>
              )}
              <ul className="tags">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="prof-acoes">
                <button className="botao" type="button" onClick={() => pedirAgendamento({ servico: servicoPrincipal(p.id), profissional: p.id })}>
                  Agendar com {p.nome.split(" ")[0]}
                </button>
                {p.formacao.length > 0 && (
                  <button className="botao botao--linha" type="button" onClick={() => setFormacao(p)}>
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

      <Modal aberto={formacao !== null} aoFechar={() => setFormacao(null)} rotulo={`Formação profissional de ${formacao?.nome ?? ""}`}>
        {formacao && (
          <div className="form-box">
            <button className="x" type="button" onClick={() => setFormacao(null)} aria-label="Fechar">×</button>
            <p className="sobre">{formacao.nome}</p>
            <h3>Formação profissional</h3>
            <p className="nota">Cursos e workshops que fazem parte da trajetória profissional.</p>
            <ul className="formacao">
              {formacao.formacao.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
