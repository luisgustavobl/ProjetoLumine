import { funcionamento } from "@/content";
import type { Ocupacao } from "./tipos";

// Regras de agenda compartilhadas pelo formulário (navegador) e pela API (servidor),
// para que os dois lados validem exatamente da mesma forma.

const FUSO = "America/Fortaleza";

/** Data de hoje (AAAA-MM-DD) no fuso de Fortaleza, independente do fuso do servidor. */
export function hojeEmFortaleza(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

/** Soma dias a uma data AAAA-MM-DD. */
export function somarDias(dataIso: string, dias: number): string {
  const d = new Date(`${dataIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Primeira data que pode ser pedida: amanhã (pedidos para o mesmo dia são pelo WhatsApp). */
export const dataMinima = () => somarDias(hojeEmFortaleza(), 1);
/** Última data que pode ser pedida (agenda aberta para os próximos 3 meses). */
export const dataMaxima = () => somarDias(hojeEmFortaleza(), 90);

export const dataValida = (dataIso: string) => /^\d{4}-\d{2}-\d{2}$/.test(dataIso) && !Number.isNaN(Date.parse(`${dataIso}T12:00:00Z`));

/** Horários de início oferecidos na data (vazio se o salão não abre nesse dia). */
export function horariosDoDia(dataIso: string): string[] {
  if (!dataValida(dataIso)) return [];
  const diaDaSemana = new Date(`${dataIso}T12:00:00Z`).getUTCDay();
  if (funcionamento.diasFechados.includes(diaDaSemana)) return [];
  const horas: string[] = [];
  for (let h = funcionamento.primeiraHora; h <= funcionamento.ultimaHora; h++) horas.push(`${String(h).padStart(2, "0")}:00`);
  return horas;
}

const sobrepoe = (hora: string, o: Ocupacao) => o.inicio === null || (o.inicio <= hora && hora < (o.fim ?? "24:00"));

/**
 * Um horário está ocupado se TODAS as candidatas estão indisponíveis nele.
 * Candidatas = a profissional escolhida ou, em "sem preferência", todas que atendem o serviço.
 * Uma ocupação sem profissional (ex.: feriado) vale para todas.
 */
export function horarioOcupado(hora: string, candidatas: string[], ocupacoes: Ocupacao[]): boolean {
  const afeta = (o: Ocupacao, prof: string | null) => (o.profissionalId === null || o.profissionalId === prof) && sobrepoe(hora, o);
  if (candidatas.length === 0) return ocupacoes.some((o) => afeta(o, null));
  return candidatas.every((prof) => ocupacoes.some((o) => afeta(o, prof)));
}

export const horasOcupadas = (dataIso: string, candidatas: string[], ocupacoes: Ocupacao[]) =>
  horariosDoDia(dataIso).filter((h) => horarioOcupado(h, candidatas, ocupacoes));
