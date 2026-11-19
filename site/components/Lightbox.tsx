"use client";

import { useEffect, useRef, useState } from "react";
import type { Foto } from "@/content";
import { urlFotoGrande } from "@/lib/util";
import Modal from "./Modal";

type Props = { fotos: Foto[]; inicio: number | null; aoFechar: () => void };

// Foto ampliada com navegação por setas, teclado (← →) e arraste no celular.
export default function Lightbox({ fotos, inicio, aoFechar }: Props) {
  const [i, setI] = useState(0);
  const toqueX = useRef(0);

  useEffect(() => {
    if (inicio !== null) setI(inicio);
  }, [inicio]);

  const passo = (d: number) => setI((atual) => (atual + d + fotos.length) % fotos.length);

  useEffect(() => {
    if (inicio === null) return;
    const teclado = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") passo(-1);
      if (e.key === "ArrowRight") passo(1);
    };
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  });

  // Pré-carrega as vizinhas para a troca ser instantânea.
  useEffect(() => {
    if (inicio === null || !fotos.length) return;
    [i + 1, i - 1].forEach((k) => {
      new Image().src = urlFotoGrande(fotos[(k + fotos.length) % fotos.length].id);
    });
  }, [i, inicio, fotos]);

  const foto = fotos[i];
  return (
    <Modal aberto={inicio !== null && !!foto} aoFechar={aoFechar} rotulo="Foto ampliada" className="lb">
      {foto && (
        <div
          className="lb-conteudo"
          onClick={(e) => e.target === e.currentTarget && aoFechar()}
          onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const d = e.changedTouches[0].clientX - toqueX.current;
            if (Math.abs(d) > 50) passo(d < 0 ? 1 : -1);
          }}
        >
          <button className="x" type="button" onClick={aoFechar} aria-label="Fechar">×</button>
          <button className="p" type="button" onClick={() => passo(-1)} aria-label="Foto anterior">‹</button>
          <figure>
            <img src={urlFotoGrande(foto.id)} alt={foto.legenda} />
            <figcaption>
              {foto.legenda} · {i + 1} de {fotos.length}
            </figcaption>
          </figure>
          <button className="n" type="button" onClick={() => passo(1)} aria-label="Próxima foto">›</button>
        </div>
      )}
    </Modal>
  );
}
