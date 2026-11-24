import { createBrowserClient } from "@supabase/ssr";

// Cliente do Supabase no navegador, com a sessão da equipe (cookies do login).
// Usado só para enviar fotos direto ao Storage, sem passar o arquivo pelo servidor do site.
export const clienteNavegador = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

const LADO_MAXIMO = 1600; // px: suficiente para a foto ampliada e bem mais leve que a original

/**
 * Reduz a foto no próprio navegador (fotos de celular têm 4–8 MB) e converte para WebP.
 * Devolve o arquivo pronto e as dimensões finais.
 */
export async function prepararFoto(arquivo: File): Promise<{ blob: Blob; largura: number; altura: number }> {
  if (!arquivo.type.startsWith("image/")) throw new Error(`"${arquivo.name}" não é uma imagem.`);
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.85));
  if (!blob) throw new Error("Não foi possível converter a imagem.");
  return { blob, largura, altura };
}
