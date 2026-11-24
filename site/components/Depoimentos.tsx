"use client";

import { useEffect, useRef, useState } from "react";
import { contato, depoimentos } from "@/content";

const GAP = 16;
const iniciais = (nome: string) =>
  nome
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

// Carrossel de avaliações do Google (3 por vez no desktop, 1 no celular).
export default function Depoimentos() {
  const trilho = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState({ voltar: false, avancar: true, atual: 0 });

  const passo = () => ((trilho.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0) + GAP;

  const atualizar = () => {
    const el = trilho.current;
    if (!el) return;
    setEstado({
      voltar: el.scrollLeft > 4,
      avancar: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      atual: Math.round(el.scrollLeft / passo()),
    });
  };

  useEffect(() => {
    atualizar();
    window.addEventListener("resize", atualizar, { passive: true });
    return () => window.removeEventListener("resize", atualizar);
  }, []);

  const rolar = (d: 1 | -1) => trilho.current?.scrollBy({ left: d * passo(), behavior: "smooth" });

  return (
    <div className="dep-car">
      <div className="dep-trilho" ref={trilho} tabIndex={0} aria-label="Depoimentos de clientes" onScroll={atualizar}>
        {depoimentos.map((d, i) => (
          <figure key={i} className="depo">
            <blockquote>“{d.texto}”</blockquote>
            <figcaption className="quem">
              <span className="av">{iniciais(d.nome)}</span>
              <span>
                <b>{d.nome}</b>
                {d.fonte}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="dep-rodape">
        <a className="google-nota" href={contato.googleMaps} target="_blank" rel="noopener noreferrer">
          <b>{contato.notaGoogle}</b> <span aria-hidden="true">★★★★★</span> {contato.avaliacoesGoogle} avaliações no Google ↗
        </a>
        {/* Indicador de página, centralizado entre a nota e as setas. */}
        <div className="dep-pontos" aria-hidden="true">
          {depoimentos.map((_, i) => (
            <i key={i} className={i === estado.atual ? "on" : undefined} />
          ))}
        </div>
        <div className="dep-ctrl">
          <button type="button" aria-label="Depoimentos anteriores" disabled={!estado.voltar} onClick={() => rolar(-1)}>‹</button>
          <button type="button" aria-label="Próximos depoimentos" disabled={!estado.avancar} onClick={() => rolar(1)}>›</button>
        </div>
      </div>
    </div>
  );
}
