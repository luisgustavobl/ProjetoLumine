"use client";

import { useEffect, useRef, useState } from "react";
import type { Foto } from "@/content";
import { atributosFoto } from "@/lib/util";

type Props = { fotos: Foto[]; titulo: string; aoAbrir: (indice: number) => void };

const GAP = 14;

// Trilho com 2,5 fotos visíveis: setas no desktop, arraste no celular, pontos de posição.
// As fotos entram deslizando quando o carrossel aparece na tela.
export default function Carrossel({ fotos, titulo, aoAbrir }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState({ voltar: false, avancar: true, atual: 0 });
  const [oculto, setOculto] = useState(false);

  const passo = () => (trilho.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;

  const atualizar = () => {
    const el = trilho.current;
    if (!el) return;
    const largura = passo() + GAP;
    setEstado({
      voltar: el.scrollLeft > 4,
      avancar: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      atual: largura ? Math.min(fotos.length - 1, Math.round(el.scrollLeft / largura)) : 0,
    });
  };

  useEffect(() => {
    atualizar();
    window.addEventListener("resize", atualizar, { passive: true });

    // Animação de entrada só se o carrossel começa fora da tela e o usuário aceita movimento.
    const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = caixa.current;
    let obs: IntersectionObserver | undefined;
    if (el && !semMovimento && el.getBoundingClientRect().top > innerHeight) {
      setOculto(true);
      obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setOculto(false);
            obs?.disconnect();
          }
        },
        { rootMargin: "0px 0px -15% 0px" }
      );
      obs.observe(el);
    }
    return () => {
      window.removeEventListener("resize", atualizar);
      obs?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rolar = (d: 1 | -1) => trilho.current?.scrollBy({ left: d * (passo() + GAP), behavior: "smooth" });

  return (
    <div ref={caixa} className={`car${oculto ? " pre" : ""}`}>
      <div ref={trilho} className="trilho" tabIndex={0} aria-label={`Trabalhos de ${titulo}`} onScroll={atualizar}>
        {fotos.map((f, i) => (
          <button key={f.id} type="button" onClick={() => aoAbrir(i)} aria-label={`Ampliar: ${f.legenda}`} style={{ transitionDelay: `${i * 90}ms` }}>
            <img {...atributosFoto(f.id, "(max-width:600px) 60vw, (max-width:860px) 37vw, 300px")} alt={f.legenda} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <button className="seta v" type="button" aria-label="Fotos anteriores" disabled={!estado.voltar} onClick={() => rolar(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button className="seta a" type="button" aria-label="Próximas fotos" disabled={!estado.avancar} onClick={() => rolar(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
      <div className="pontos" aria-hidden="true">
        {fotos.map((f, i) => (
          <i key={f.id} className={i === estado.atual ? "on" : undefined} />
        ))}
      </div>
    </div>
  );
}
