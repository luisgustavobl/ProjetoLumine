"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import BotaoTema from "./BotaoTema";

type Item = { href: string; rotulo: string; icone: React.ReactNode };

// Ícones simples (traço), herdam a cor do texto.
const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="p-icone">{d}</svg>
);
const ICONES = {
  agenda: svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  fotos: svg(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="M21 16l-5-5-9 10" /></>),
  precos: svg(<><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>),
  profissionais: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
};

type Props = { nome: string; agendaLigada: boolean; pendentes: number; sair: () => Promise<void> };

// Navegação do painel. Celular: barra de abas fixa embaixo (como um app) + topo com Sair.
// Computador: barra lateral.
export default function PainelNav({ nome, agendaLigada, pendentes, sair }: Props) {
  const caminho = usePathname();
  const itens: Item[] = [
    ...(agendaLigada ? [{ href: "/painel/agenda", rotulo: "Agenda", icone: ICONES.agenda }] : []),
    { href: "/painel/fotos", rotulo: "Fotos", icone: ICONES.fotos },
    { href: "/painel/precos", rotulo: "Preços", icone: ICONES.precos },
    { href: "/painel/profissionais", rotulo: "Profissionais", icone: ICONES.profissionais },
  ];

  return (
    <>
      <header className="p-topo">
        <Link href="/painel" className="logo" aria-label="Início do painel">
          <Logo className="logo-svg" />
        </Link>
        <span className="p-ola">Olá, {nome.split(" ")[0]}</span>
        {/* No computador estas ações ficam no pé da barra lateral. */}
        <div className="p-topo-acoes">
          <BotaoTema />
          <a className="p-link" href="/" target="_blank" rel="noopener noreferrer">Ver site ↗</a>
          <form action={sair}>
            <button type="submit" className="p-link">Sair</button>
          </form>
        </div>
      </header>
      <nav className="p-abas" aria-label="Seções do painel">
        {itens.map((i) => {
          const ativo = caminho.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={ativo ? "ativo" : undefined} aria-current={ativo ? "page" : undefined}>
              {i.icone}
              <span>{i.rotulo}</span>
              {i.href === "/painel/agenda" && pendentes > 0 && <span className="p-badge" aria-label={`${pendentes} pendentes`}>{pendentes}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
