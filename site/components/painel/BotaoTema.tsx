"use client";

import { useEffect, useState } from "react";

type Tema = "claro" | "escuro";
export const CHAVE_TEMA = "painel-tema";

/** Script que roda antes da página aparecer: aplica o tema salvo sem "piscar" o outro. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE_TEMA}");if(t==="claro"||t==="escuro")document.documentElement.dataset.tema=t}catch(e){}`;

const temaDoSistema = (): Tema => (matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro");

// Botão discreto (sol/lua) que alterna o tema do painel. A escolha fica salva só neste aparelho.
export default function BotaoTema() {
  const [tema, setTema] = useState<Tema | null>(null); // null até ler o navegador (evita divergir do servidor)

  useEffect(() => {
    const salvo = document.documentElement.dataset.tema;
    setTema(salvo === "claro" || salvo === "escuro" ? salvo : temaDoSistema());
  }, []);

  function alternar() {
    const novo: Tema = tema === "escuro" ? "claro" : "escuro";
    document.documentElement.dataset.tema = novo;
    try { localStorage.setItem(CHAVE_TEMA, novo); } catch { /* modo privado: vale só até fechar */ }
    setTema(novo);
  }

  const proximo = tema === "escuro" ? "claro" : "escuro";
  return (
    <button type="button" className="p-link p-tema" onClick={alternar} aria-label={`Mudar para o tema ${proximo}`} title={`Tema ${proximo}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="p-icone">
        {tema === "escuro" ? (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
    </button>
  );
}
