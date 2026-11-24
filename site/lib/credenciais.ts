// Regras de usuário e senha do painel, usadas no primeiro acesso e no comando `npm run usuarios`.

/** Domínio usado quando a pessoa entra com um usuário curto ("gleicy") em vez de e-mail. */
const DOMINIO_USUARIO = "equipe.lumine.app";

/** "gleicy" -> "gleicy@equipe.lumine.app"; e-mails passam direto. */
export const loginParaEmail = (login: string) => {
  const limpo = login.trim().toLowerCase();
  return limpo.includes("@") ? limpo : `${limpo}@${DOMINIO_USUARIO}`;
};

/** Devolve o problema encontrado, ou null se usuário e senha são válidos. */
export function problemaNasCredenciais(usuario: string, senha: string): string | null {
  if (!/^[a-z0-9._-]{3,30}$/i.test(usuario) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario)) {
    return "Usuário: 3 a 30 letras, números, ponto, hífen ou sublinhado (ou um e-mail).";
  }
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  return null;
}
