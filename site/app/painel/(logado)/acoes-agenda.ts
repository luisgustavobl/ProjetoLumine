"use server";

import { revalidatePath } from "next/cache";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";

const STATUS_VALIDOS = ["pendente", "confirmado", "recusado", "cancelado"] as const;
export type StatusPedido = (typeof STATUS_VALIDOS)[number];

/** Muda o status de um pedido (confirmar, recusar, cancelar ou voltar para pendente). */
export async function mudarStatusPedido(id: string, status: StatusPedido): Promise<{ erro?: string }> {
  await exigirEquipe();
  if (!STATUS_VALIDOS.includes(status)) return { erro: "Status inválido." };

  try {
    const db = await clienteSessao();
    const { error } = await db.from("pedidos").update({ status }).eq("id", id);
    if (error) {
      // 23505 = o índice único do banco barrou dois confirmados no mesmo horário.
      if (error.code === "23505") return { erro: "Já existe um agendamento confirmado para essa profissional nesse horário." };
      throw new Error(error.message);
    }
  } catch (erro) {
    console.error("[painel/agenda]", (erro as Error).message);
    return { erro: "Não foi possível atualizar o pedido. Tente de novo." };
  }
  revalidatePath("/painel", "layout"); // atualiza agenda e o contador de pendentes
  return {};
}

/** Define a profissional de um pedido feito com "sem preferência". */
export async function definirProfissional(id: string, profissionalId: string): Promise<{ erro?: string }> {
  await exigirEquipe();
  try {
    const db = await clienteSessao();
    const { error } = await db.from("pedidos").update({ profissional_id: profissionalId || null }).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (erro) {
    console.error("[painel/agenda]", (erro as Error).message);
    return { erro: "Não foi possível definir a profissional." };
  }
  revalidatePath("/painel");
  return {};
}
