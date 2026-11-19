import "server-only";
import { createClient } from "@supabase/supabase-js";

// Clientes do Supabase usados SOMENTE no servidor ("server-only" impede import no navegador).

function variavel(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome} (veja site/.env.local)`);
  return valor;
}

/** Cliente com a chave pública: obedece às regras de RLS como um visitante. */
export function clientePublico() {
  return createClient(variavel("NEXT_PUBLIC_SUPABASE_URL"), variavel("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false },
  });
}

/**
 * Cliente com a chave secreta: ignora RLS. Usado só em rotas de API que já
 * validaram tudo (ex.: gravar um pedido) e nunca enviado ao navegador.
 */
export function clienteAdmin() {
  return createClient(variavel("NEXT_PUBLIC_SUPABASE_URL"), variavel("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
