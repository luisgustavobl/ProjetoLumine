import "server-only";
import { revalidatePath } from "next/cache";
import { clienteSessao, exigirEquipe } from "@/lib/sessao";

const PREFIXO_PUBLICO = "/storage/v1/object/public/fotos/";

type Destino = {
  tabela: "profissionais" | "servicos";
  coluna: "retrato_url" | "foto_url";
  pasta: "perfis" | "servicos"; // pasta do Storage reservada a este tipo de imagem
};

/**
 * Troca a imagem única de um registro (foto de perfil da profissional ou foto do serviço).
 * O navegador já enviou o arquivo ao Storage; aqui conferimos o caminho, gravamos a URL
 * e apagamos a imagem anterior se ela também tiver sido enviada por aqui.
 */
export async function trocarImagem(destino: Destino, id: string, caminho: string): Promise<{ erro?: string }> {
  // O caminho vem do navegador: só aceitamos o formato que o próprio painel gera.
  const esperado = new RegExp(`^${destino.pasta}/${id.replace(/[^a-z0-9-]/g, "")}/[0-9a-f-]{36}\\.webp$`);
  if (!esperado.test(caminho)) return { erro: "Arquivo inválido." };

  try {
    await exigirEquipe();
    const db = await clienteSessao();
    const anterior = await db.from(destino.tabela).select(destino.coluna).eq("id", id).single();
    if (anterior.error) throw new Error(anterior.error.message);

    const url = db.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
    const { error } = await db.from(destino.tabela).update({ [destino.coluna]: url }).eq("id", id);
    if (error) throw new Error(error.message);

    // Só apaga a antiga se ela estiver na pasta exclusiva (fotos da grade podem estar em uso como perfil).
    const urlAntiga = (anterior.data as Record<string, string | null>)[destino.coluna] ?? "";
    const posicao = urlAntiga.indexOf(PREFIXO_PUBLICO);
    const caminhoAntigo = posicao >= 0 ? decodeURIComponent(urlAntiga.slice(posicao + PREFIXO_PUBLICO.length)) : "";
    if (caminhoAntigo.startsWith(`${destino.pasta}/`)) {
      const remocao = await db.storage.from("fotos").remove([caminhoAntigo]);
      if (remocao.error) console.error("[painel/imagem] antiga não removida:", remocao.error.message);
    }
  } catch (erro) {
    console.error(`[painel/imagem] ${destino.tabela}:`, (erro as Error).message);
    return { erro: "Não foi possível trocar a foto. Tente de novo." };
  }
  revalidatePath("/painel", "layout");
  revalidatePath("/");
  return {};
}
