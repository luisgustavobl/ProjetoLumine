"use client";

import { useEffect, useRef, useState } from "react";
import { navegacao } from "@/content";
import Logo from "./Logo";

// Navbar fixa: sublinhado deslizante no hover, destaque da seção visível e menu hambúrguer no celular.
export default function Navbar() {
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [indicador, setIndicador] = useState({ left: 0, width: 0 });
  const lista = useRef<HTMLUListElement>(null);

  // Seção visível no meio da tela → item ativo.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setAtivo(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ["inicio", ...navegacao.map((n) => n.href.slice(1))].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Posiciona o sublinhado no item em hover ou, sem hover, no ativo.
  useEffect(() => {
    const alvo = hover ?? ativo;
    const link = alvo ? lista.current?.querySelector<HTMLElement>(`a[href="${alvo}"]`) : null;
    if (!link || !lista.current) return setIndicador({ left: 0, width: 0 });
    const r = link.getBoundingClientRect();
    const p = lista.current.getBoundingClientRect();
    setIndicador({ left: r.left - p.left, width: r.width });
  }, [hover, ativo]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !(e.target as Element).closest(".nav") && setAberto(false);
    document.addEventListener("click", fora);
    return () => document.removeEventListener("click", fora);
  }, [aberto]);

  return (
    <header className="nav">
      <div className="wrap">
        <a className="logo" href="#inicio" onClick={() => setAberto(false)}>
          <Logo className="logo-svg" />
        </a>
        <nav aria-label="Principal">
          <ul ref={lista} id="menu" className={`menu${aberto ? " aberto" : ""}`} onMouseLeave={() => setHover(null)}>
            {navegacao.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={ativo === item.href ? "ativo" : undefined}
                  onMouseEnter={() => setHover(item.href)}
                  onClick={() => setAberto(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <span className="ind" aria-hidden="true" style={{ ...indicador, opacity: indicador.width ? 1 : 0 }} />
          </ul>
        </nav>
        <button
          className="burger"
          type="button"
          aria-expanded={aberto}
          aria-controls="menu"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setAberto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
