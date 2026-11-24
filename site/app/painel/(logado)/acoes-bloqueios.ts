"use server";

import { revalidatePath } from "next/cache";
import { dataValida } from "@/lib/agenda";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";
import type { EstadoForm } from "../acoes-auth";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Cria um bloqueio: um dia inteiro ou um intervalo, para uma profissional ou para todas. */
export async function criarBloqueio(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirEquipe();
  const profissional = String(form.get("profissional") ?? "");
  const data = String(form.get("data") ?? "");
  const diaInteiro = form.get("dia_inteiro") === "on";
  const inicio = String(form.get("inicio") ?? "");
  const fim = String(form.get("fim") ?? "");
  const motivo = String(form.get("motivo") ?? "").trim().slice(0, 120);

  if (!dataValida(data)) return { erro: "Escolha a data." };
  if (!diaInteiro) {
    if (!HORA.test(inicio) || !HORA.test(fim)) return { erro: "Informe o horário de início e de fim (ou marque dia inteiro)." };
    if (fim <= inicio) return { erro: "O fim precisa ser depois do início." };
  }

  try {
    const db = await clienteSessao();
    const { error } = await db.from("bloqueios").insert({
      profissional_id: profissional || null,
      data,
      hora_inicio: diaInteiro ? null : inicio,
      hora_fim: diaInteiro ? null : fim,
      motivo: motivo || null,
    });
    if (error) throw new Error(error.message);
  } catch (erro) {
    console.error("[painel/bloqueios]", (erro as Error).message);
    return { erro: "Não foi possível salvar o bloqueio." };
  }
  revalidatePath("/painel", "layout");
  return { ok: "Bloqueio salvo. Esses horários já somem do site." };
}

export async function removerBloqueio(id: string): Promise<void> {
  await exigirEquipe();
  const db = await clienteSessao();
  const { error } = await db.from("bloqueios").delete().eq("id", id);
  if (error) console.error("[painel/bloqueios]", error.message);
  revalidatePath("/painel", "layout");
}
