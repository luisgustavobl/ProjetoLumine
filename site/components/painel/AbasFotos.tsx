"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

type Aba = { id: string; nome: string; retrato?: string | null };

// Abas de Fotos: marcam a escolhida na hora e esmaecem a grade enquanto a nova carrega;
// a grade nova entra com um leve fade (classe ig-entrar).
export default function AbasFotos({ abas, atual, children }: { abas: Aba[]; atual: string; children: ReactNode }) {
  const router = useRouter();
  const [escolhida, setEscolhida] = useState(atual);
  const [carregando, iniciar] = useTransition();
  const ativa = carregando ? escolhida : atual;

  function abrir(id: string, e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // deixa abrir em nova aba
    e.preventDefault();
    if (id === atual) return;
    setEscolhida(id);
    iniciar(() => router.push(`/painel/fotos?aba=${id}`, { scroll: false }));
  }

  return (
    <>
      <nav className="chips ig-abas" aria-label="Escolher perfil">
        {abas.map((a) => (
          <a key={a.id} href={`/painel/fotos?aba=${a.id}`} className="chip" aria-current={a.id === ativa ? "page" : undefined}
            onClick={(e) => abrir(a.id, e)} onMouseEnter={() => router.prefetch(`/painel/fotos?aba=${a.id}`)}>
            <span className="ig-aba-foto" aria-hidden="true">{a.retrato ? <img src={a.retrato} alt="" /> : a.nome[0]}</span>
            {a.nome}
          </a>
        ))}
      </nav>
      <div className={`ig-conteudo${carregando ? " carregando" : ""}`} aria-busy={carregando}>
        <div key={atual} className="ig-entrar">{children}</div>
      </div>
    </>
  );
}
