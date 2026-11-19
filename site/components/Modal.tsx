"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  rotulo: string;
  className?: string;
  children: ReactNode;
};

// Janela modal acessível: Esc fecha, clique no fundo fecha, trava a rolagem
// da página e devolve o foco para quem abriu.
export default function Modal({ aberto, aoFechar, rotulo, className = "", children }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  // Guarda a função num ref para o efeito rodar só ao abrir/fechar (e não a cada render).
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;

  useEffect(() => {
    if (!aberto) return;
    const focoAnterior = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    caixa.current?.querySelector<HTMLElement>("button")?.focus();
    const teclado = (e: KeyboardEvent) => e.key === "Escape" && fecharRef.current();
    document.addEventListener("keydown", teclado);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", teclado);
      focoAnterior?.focus();
    };
  }, [aberto]);

  if (!aberto) return null;
  // Portal no <body>: as seções usam content-visibility, que prenderia o position:fixed dentro delas.
  return createPortal(
    <div
      ref={caixa}
      className={`modal ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={rotulo}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      {children}
    </div>,
    document.body
  );
}
