import "server-only";
import { clientePublico } from "./supabase";
import type { Ocupacao } from "./tipos";

/** Intervalos indisponíveis numa data (pedidos confirmados + bloqueios), sem dados pessoais. */
export async function buscarOcupacoes(dataIso: string): Promise<Ocupacao[]> {
  const { data, error } = await clientePublico()
    .from("horarios_ocupados")
    .select("profissional_id, hora_inicio, hora_fim")
    .eq("data", dataIso);
  if (error) throw new Error(`Não foi possível ler a agenda: ${error.message}`);
  const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null); // "10:00:00" -> "10:00"
  return data.map((o) => ({ profissionalId: o.profissional_id, inicio: hhmm(o.hora_inicio), fim: hhmm(o.hora_fim) }));
}

/** Quem pode atender o pedido: a profissional escolhida ou todas que fazem o serviço. */
export async function candidatasDoServico(servicoId: string, profissionalId: string | null): Promise<string[] | null> {
  const { data, error } = await clientePublico()
    .from("servico_profissional")
    .select("profissional_id")
    .eq("servico_id", servicoId);
  if (error) throw new Error(`Não foi possível ler os serviços: ${error.message}`);
  const atendem = data.map((x) => x.profissional_id as string);
  if (!atendem.length) return null; // serviço inexistente
  if (profissionalId) return atendem.includes(profissionalId) ? [profissionalId] : null;
  return atendem;
}
