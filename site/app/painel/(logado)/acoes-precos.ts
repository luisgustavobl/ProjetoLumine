"use server";

import { revalidatePath } from "next/cache";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";
import type { ItemPreco, TabelaPreco, TipoPreco } from "@/lib/tipos";
import type { EstadoForm } from "../acoes-auth";
import { trocarImagem } from "./trocar-imagem";

const TIPOS: TipoPreco[] = ["fixo", "a_partir", "faixa", "consulta"];
const ID_VALIDO = /^[a-z0-9-]{1,80}$/;

export type ServicoEditado = { id: string; nome: string; descricao: string; novo: boolean };
export type TabelaEditada = TabelaPreco & { nova: boolean };
export type AlteracoesPrecos = { servicos: ServicoEditado[]; tabelas: TabelaEditada[]; removidas: string[] };

/** Confere um item antes de salvar; devolve a mensagem de erro ou null. */
function problemaNoItem(item: ItemPreco, onde: string): string | null {
  if (!item.nome.trim()) return `${onde}: falta o nome do serviço.`;
  if (!TIPOS.includes(item.tipo)) return `${onde}: tipo de preço inválido.`;
  if (item.tipo !== "consulta" && (item.valor == null || item.valor < 0)) return `${onde}: informe o valor.`;
  if (item.tipo === "faixa" && (item.valorMax == null || item.valorMax < (item.valor ?? 0))) {
    return `${onde}: na faixa, o valor máximo precisa ser maior que o mínimo.`;
  }
  if (item.duracaoMin != null && (item.duracaoMin <= 0 || item.duracaoMin > 720)) return `${onde}: duração inválida.`;
  return null;
}

function problemaNasAlteracoes({ servicos, tabelas, removidas }: AlteracoesPrecos): string | null {
  for (const s of servicos) {
    if (!ID_VALIDO.test(s.id)) return "Serviço inválido.";
    if (s.nome.trim().length < 2) return "Todo serviço precisa de um nome.";
  }
  if (removidas.some((id) => !ID_VALIDO.test(id))) return "Tabela inválida.";
  for (const t of tabelas) {
    if (!ID_VALIDO.test(t.id) || !ID_VALIDO.test(t.servicoId)) return "Tabela inválida.";
    if (!t.titulo.trim()) return "Toda tabela precisa de um título.";
    if (!t.profissionais.length) return `“${t.titulo}”: marque pelo menos uma profissional.`;
    for (const [i, item] of t.itens.entries()) {
      const problema = problemaNoItem(item, `“${t.titulo}”, item ${i + 1}`);
      if (problema) return problema;
    }
  }
  return null;
}

/** Salva todas as alterações da página de Preços numa única transação (função salvar_precos no banco). */
export async function salvarPrecos(alteracoes: AlteracoesPrecos): Promise<EstadoForm> {
  await exigirEquipe();
  const problema = problemaNasAlteracoes(alteracoes);
  if (problema) return { erro: problema };

  // Normaliza: sem valor em "sob consulta" e sem máximo fora de "faixa".
  const tabelas = alteracoes.tabelas.map((t) => ({
    ...t,
    titulo: t.titulo.trim(),
    itens: t.itens.map((i) => ({
      ...i,
      nome: i.nome.trim(),
      valor: i.tipo === "consulta" ? null : i.valor,
      valorMax: i.tipo === "faixa" ? i.valorMax : null,
    })),
  }));
  const servicos = alteracoes.servicos.map((s) => ({ ...s, nome: s.nome.trim().slice(0, 40), descricao: s.descricao.trim().slice(0, 120) }));

  try {
    const db = await clienteSessao();
    const { error } = await db.rpc("salvar_precos", { p_servicos: servicos, p_tabelas: tabelas, p_removidas: alteracoes.removidas });
    if (error) throw new Error(error.message);
  } catch (erro) {
    console.error("[painel/precos]", (erro as Error).message);
    return { erro: "Não foi possível salvar. Suas alterações continuam aqui; tente de novo." };
  }
  revalidatePath("/painel", "layout");
  revalidatePath("/"); // o site mostra os preços novos na hora
  return { ok: "Salvo. O site já mostra os novos preços." };
}

/** Grava a nova foto do cartão do serviço (o navegador já enviou o arquivo para servicos/<id>/). */
export async function trocarFotoServico(id: string, caminho: string) {
  return trocarImagem({ tabela: "servicos", coluna: "foto_url", pasta: "servicos" }, id, caminho);
}
