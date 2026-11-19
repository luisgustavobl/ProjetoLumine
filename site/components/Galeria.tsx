"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Foto } from "@/content";
import { atributosFoto } from "@/lib/util";
import Lightbox from "./Lightbox";

export type FotoGaleria = Foto & { categoria: string };
type Filtro = { id: string; rotulo: string; categorias: string[] | null };

const FILTROS: Filtro[] = [
  { id: "todos", rotulo: "Tudo", categorias: null },
  { id: "makes", rotulo: "Makes & penteados", categorias: ["gleicy"] },
  { id: "unhas", rotulo: "Unhas", categorias: ["evelyne", "kamila"] },
  { id: "tattoo", rotulo: "Tattoo", categorias: ["ganesha"] },
  { id: "espaco", rotulo: "Espaço", categorias: ["geral"] },
];

// Mosaico com filtros. Fechado, mostra ~2,5 linhas com degradê e o botão "Ver todas".
export default function Galeria({ fotos }: { fotos: FotoGaleria[] }) {
  const [filtro, setFiltro] = useState("todos");
  const [expandida, setExpandida] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);
  const [alturaMax, setAlturaMax] = useState<number | undefined>(undefined);
  const [cabeTudo, setCabeTudo] = useState(false);
  const grade = useRef<HTMLDivElement>(null);

  const lista = useMemo(() => {
    const cats = FILTROS.find((f) => f.id === filtro)?.categorias;
    return cats ? fotos.filter((f) => cats.includes(f.categoria)) : fotos;
  }, [filtro, fotos]);

  const ajustar = useCallback(() => {
    const g = grade.current;
    if (!g) return;
    const primeira = g.querySelector("button");
    const fechada = primeira ? Math.round(primeira.offsetWidth * 1.22 * 2.45) : 600;
    const cabe = g.scrollHeight <= fechada + 40;
    setCabeTudo(cabe);
    setAlturaMax(expandida || cabe ? g.scrollHeight : fechada);
  }, [expandida]);

  useEffect(() => {
    const quadro = requestAnimationFrame(ajustar);
    window.addEventListener("resize", ajustar, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", ajustar);
    };
  }, [ajustar, lista]);

  const escolher = (id: string) => {
    setFiltro(id);
    setExpandida(false);
  };

  return (
    <>
      <div className="chips" role="group" aria-label="Filtrar galeria">
        {FILTROS.map((f) => (
          <button key={f.id} className="chip" type="button" aria-pressed={filtro === f.id} onClick={() => escolher(f.id)}>
            {f.rotulo}
          </button>
        ))}
      </div>
      <div className={`gal-box${expandida || cabeTudo ? " aberta" : ""}`} style={{ maxHeight: alturaMax }}>
        <div className="galeria" ref={grade}>
          {lista.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setAberta(i)} aria-label={`Ampliar: ${f.legenda}`}>
              <img {...atributosFoto(f.id, "(max-width:600px) 48vw, 280px")} alt={f.legenda} loading="lazy" decoding="async" onLoad={() => expandida && ajustar()} />
            </button>
          ))}
        </div>
      </div>
      {!cabeTudo && (
        <div className="mais">
          <button
            className="botao botao--linha"
            type="button"
            aria-expanded={expandida}
            onClick={() => {
              if (expandida) document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth" });
              setExpandida(!expandida);
            }}
          >
            {expandida ? "Mostrar menos" : `Ver todas as fotos (${lista.length})`}
          </button>
        </div>
      )}
      <Lightbox fotos={lista} inicio={aberta} aoFechar={() => setAberta(null)} />
    </>
  );
}
