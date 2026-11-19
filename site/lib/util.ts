import { DIMENSOES, type FotoId, type ItemPreco, type TabelaPreco } from "@/content";

/** Atributos de <img> responsivos para uma foto de public/img. */
export function atributosFoto(id: FotoId, sizes: string) {
  const [width, height] = DIMENSOES[id];
  return {
    src: `/img/${id}-480.webp`,
    srcSet: `/img/${id}-480.webp 480w, /img/${id}-960.webp 960w`,
    sizes,
    width,
    height,
  };
}

export const urlFotoGrande = (id: FotoId) => `/img/${id}-960.webp`;

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Texto do preço de um item: "R$ 80", "a partir de R$ 180", "R$ 120 – R$ 250" ou "sob consulta". */
export function formatarPreco(item: ItemPreco): string {
  switch (item.tipo) {
    case "fixo":
      return item.valor != null ? reais(item.valor) : "sob consulta";
    case "a_partir":
      return item.valor != null ? `a partir de ${reais(item.valor)}` : "sob consulta";
    case "faixa":
      return item.valor != null && item.valorMax != null ? `${reais(item.valor)} – ${reais(item.valorMax)}` : "sob consulta";
    default:
      return "sob consulta";
  }
}

/** Menor preço entre as tabelas de um serviço (usado no card: "a partir de R$ X"). */
export function menorPreco(tabelas: TabelaPreco[]): string | null {
  const valores = tabelas.flatMap((t) => t.itens).filter((i) => i.tipo !== "consulta" && !i.adicional && i.valor != null).map((i) => i.valor!);
  return valores.length ? `a partir de ${reais(Math.min(...valores))}` : null;
}

export const formatarDuracao = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

export const linkWhatsapp = (numero: string, texto: string) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

/** Evento global usado pelos cards/botões para escolher serviço e profissional no formulário. */
export const EVENTO_AGENDAR = "lumine:agendar";
export type DetalheAgendar = { servico: string; profissional?: string };
export function pedirAgendamento(detalhe: DetalheAgendar) {
  window.dispatchEvent(new CustomEvent<DetalheAgendar>(EVENTO_AGENDAR, { detail: detalhe }));
}
