"use server";

import { revalidatePath } from "next/cache";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";

type Resultado = { erro?: string };
export type FotoEnviada = { caminho: string; largura: number; altura: number };

const PREFIXO_STORAGE = "/storage/v1/object/public/fotos/";

function atualizarSite() {
  revalidatePath("/painel/fotos");
  revalidatePath("/");
}

async function executar(contexto: string, fn: () => Promise<void>): Promise<Resultado> {
  try {
    await exigirEquipe();
    await fn();
    atualizarSite();
    return {};
  } catch (erro) {
    console.error(`[painel/fotos] ${contexto}:`, (erro as Error).message);
    return { erro: "Não foi possível concluir. Tente de novo." };
  }
}

/** Registra no banco as fotos que o navegador acabou de enviar ao Storage. Entram no fim da grade. */
export async function registrarFotos(dono: string | null, fotos: FotoEnviada[]): Promise<Resultado> {
  return executar("registrar", async () => {
    // O caminho vem do navegador: só aceitamos o formato que o próprio painel gera.
    const esperado = new RegExp(`^${(dono ?? "espaco").replace(/[^a-z0-9-]/g, "")}/[0-9a-f-]{36}\\.webp$`);
    if (!fotos.length || fotos.some((f) => !esperado.test(f.caminho))) throw new Error("caminho de foto inválido");
    const db = await clienteSessao();
    const consulta = db.from("fotos").select("ordem").order("ordem", { ascending: false }).limit(1);
    const { data: ultima } = await (dono ? consulta.eq("profissional_id", dono) : consulta.is("profissional_id", null));
    let ordem = (ultima?.[0]?.ordem ?? -1) + 1;

    const linhas = fotos.map((f) => {
      const url = db.storage.from("fotos").getPublicUrl(f.caminho).data.publicUrl;
      return { profissional_id: dono, url, url_grande: url, largura: f.largura, altura: f.altura, legenda: "", ordem: ordem++ };
    });
    const { error } = await db.from("fotos").insert(linhas);
    if (error) throw new Error(error.message);
  });
}

export async function atualizarFoto(id: string, campos: { legenda?: string; na_galeria?: boolean; na_abertura?: boolean }): Promise<Resultado> {
  return executar("atualizar", async () => {
    const db = await clienteSessao();
    const dados = { ...campos, legenda: campos.legenda?.trim().slice(0, 120) };
    if (dados.legenda === undefined) delete dados.legenda;
    const { error } = await db.from("fotos").update(dados).eq("id", id);
    if (error) throw new Error(error.message);
  });
}

/** Salva a nova ordem depois de arrastar e soltar (uma única chamada ao banco). */
export async function reordenarFotos(ids: string[]): Promise<Resultado> {
  return executar("reordenar", async () => {
    const db = await clienteSessao();
    const { error } = await db.rpc("reordenar_fotos", { p_ids: ids });
    if (error) throw new Error(error.message);
  });
}

/** Apaga a foto do site e, se ela foi enviada pelo painel, também o arquivo no Storage. */
export async function apagarFoto(id: string): Promise<Resultado> {
  return executar("apagar", async () => {
    const db = await clienteSessao();
    const { data: foto, error } = await db.from("fotos").delete().eq("id", id).select("url").single();
    if (error) throw new Error(error.message);
    const posicao = foto.url.indexOf(PREFIXO_STORAGE);
    if (posicao >= 0) {
      const caminho = decodeURIComponent(foto.url.slice(posicao + PREFIXO_STORAGE.length));
      const { error: erroArquivo } = await db.storage.from("fotos").remove([caminho]);
      if (erroArquivo) console.error("[painel/fotos] arquivo não removido:", erroArquivo.message);
    }
  });
}
