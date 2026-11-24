/**
 * Gerencia as contas do painel pelo terminal (só quem tem o .env.local com a chave secreta).
 *
 *   npm run usuarios -- listar
 *   npm run usuarios -- criar <usuario> "<Nome>" [profissional]   (pede a senha)
 *   npm run usuarios -- master <usuario> "<Nome>"                  (conta master; pede a senha)
 *   npm run usuarios -- promover <usuario>                         (torna uma conta existente master)
 *   npm run usuarios -- senha <usuario>                            (pede a nova senha)
 *   npm run usuarios -- remover <usuario>
 *
 * Exemplo: npm run usuarios -- criar evelyne "Evelyne Almeida" evelyne
 * A profissional entra no painel com o usuário "evelyne" e a senha definida.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { loginParaEmail, problemaNasCredenciais } from "../lib/credenciais";

config({ path: ".env.local", quiet: true });

function clienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local");
  return createClient(url, chave, { auth: { persistSession: false } });
}

/** Lê uma senha no terminal sem mostrar o que é digitado. */
function perguntarSenha(pergunta: string): Promise<string> {
  let mudo = false;
  const saida = new Writable({
    write(pedaco, codificacao, pronto) {
      if (!mudo) process.stdout.write(pedaco, codificacao);
      pronto();
    },
  });
  const rl = createInterface({ input: process.stdin, output: saida, terminal: true });
  return new Promise((resolver) => {
    rl.question(pergunta, (resposta) => {
      rl.close();
      process.stdout.write("\n");
      resolver(resposta);
    });
    mudo = true;
  });
}

async function pedirSenhaNova(): Promise<string> {
  const senha = await perguntarSenha("Senha (mínimo 8 caracteres): ");
  const repetida = await perguntarSenha("Repita a senha: ");
  if (senha !== repetida) throw new Error("As senhas não conferem.");
  return senha;
}

async function idDoUsuario(usuario: string): Promise<string> {
  const { data, error } = await clienteAdmin().from("equipe").select("user_id").eq("usuario", usuario).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Usuário "${usuario}" não encontrado. Veja: npm run usuarios -- listar`);
  return data.user_id;
}

async function listar() {
  const { data, error } = await clienteAdmin().from("equipe").select("usuario, nome, profissional_id, admin, criado_em").order("criado_em");
  if (error) throw new Error(error.message);
  if (!data.length) return console.log("Nenhuma conta ainda.");
  console.table(data.map((m) => ({ usuario: m.usuario, nome: m.nome, profissional: m.profissional_id ?? "—", master: m.admin ? "sim" : "" })));
}

async function criar(usuario: string, nome: string, profissional?: string, master = false) {
  if (!usuario || !nome) {
    throw new Error(master ? 'Uso: npm run usuarios -- master <usuario> "<Nome>"' : 'Uso: npm run usuarios -- criar <usuario> "<Nome>" [profissional]');
  }
  usuario = usuario.toLowerCase();
  const senha = await pedirSenhaNova();
  const problema = problemaNasCredenciais(usuario, senha);
  if (problema) throw new Error(problema);

  const admin = clienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({ email: loginParaEmail(usuario), password: senha, email_confirm: true });
  if (error) throw new Error(`Não foi possível criar a conta: ${error.message}`);
  const r = await admin.from("equipe").insert({ user_id: data.user.id, nome, usuario, profissional_id: profissional ?? null, admin: master });
  if (r.error) {
    await admin.auth.admin.deleteUser(data.user.id); // desfaz para não deixar conta órfã
    throw new Error(`Não foi possível registrar na equipe: ${r.error.message}`);
  }
  console.log(`✓ Conta${master ? " master" : ""} criada. Entrar em /painel com o usuário "${usuario}" e a senha definida.`);
}

async function trocarSenha(usuario: string) {
  if (!usuario) throw new Error("Uso: npm run usuarios -- senha <usuario>");
  const id = await idDoUsuario(usuario);
  const senha = await pedirSenhaNova();
  const problema = problemaNasCredenciais(usuario, senha);
  if (problema) throw new Error(problema);
  const { error } = await clienteAdmin().auth.admin.updateUserById(id, { password: senha });
  if (error) throw new Error(error.message);
  console.log(`✓ Senha de "${usuario}" alterada.`);
}

async function promover(usuario: string) {
  if (!usuario) throw new Error("Uso: npm run usuarios -- promover <usuario>");
  const { error } = await clienteAdmin().from("equipe").update({ admin: true }).eq("user_id", await idDoUsuario(usuario));
  if (error) throw new Error(error.message);
  console.log(`✓ "${usuario}" agora é master.`);
}

async function remover(usuario: string) {
  if (!usuario) throw new Error("Uso: npm run usuarios -- remover <usuario>");
  const { error } = await clienteAdmin().auth.admin.deleteUser(await idDoUsuario(usuario)); // apaga da equipe junto (cascade)
  if (error) throw new Error(error.message);
  console.log(`✓ Conta "${usuario}" removida.`);
}

const [comando, ...args] = process.argv.slice(2);
const comandos: Record<string, () => Promise<void>> = {
  listar,
  criar: () => criar(args[0], args[1], args[2]),
  master: () => criar(args[0], args[1], undefined, true),
  promover: () => promover(args[0]),
  senha: () => trocarSenha(args[0]),
  remover: () => remover(args[0]),
};

(comandos[comando] ?? (async () => console.log("Comandos: listar | criar <usuario> \"<Nome>\" [profissional] | master <usuario> \"<Nome>\" | promover <usuario> | senha <usuario> | remover <usuario>")))()
  .catch((erro: Error) => {
    console.error("✗", erro.message);
    process.exit(1);
  });
