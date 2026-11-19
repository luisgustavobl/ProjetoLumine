/**
 * Cria/atualiza a estrutura do banco e faz a carga inicial de conteúdo.
 *
 *   npm run db:migrar
 *
 * 1. Executa, em ordem, os arquivos de supabase/migrations/*.sql (são idempotentes).
 * 2. Se o banco ainda não tem profissionais, insere o conteúdo de content.ts
 *    (profissionais, serviços, preços e fotos). Depois disso, quem manda é o painel:
 *    rodar de novo NÃO sobrescreve o que a equipe editou.
 *
 * Tudo roda dentro de uma transação: se algo falhar, nada é aplicado pela metade.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import {
  DIMENSOES,
  atendePor,
  formacaoGleicy,
  fotosGerais,
  profissionais,
  servicos,
  tabelasPreco,
  type FotoId,
} from "../content";

config({ path: ".env.local" });

const PASTA_MIGRACOES = join(__dirname, "..", "supabase", "migrations");
const urlPequena = (id: FotoId) => `/img/${id}-480.webp`;
const urlGrande = (id: FotoId) => `/img/${id}-960.webp`;

async function aplicarMigracoes(db: Client) {
  const arquivos = readdirSync(PASTA_MIGRACOES).filter((f) => f.endsWith(".sql")).sort();
  for (const arquivo of arquivos) {
    await db.query(readFileSync(join(PASTA_MIGRACOES, arquivo), "utf8"));
    console.log(`  ✓ ${arquivo}`);
  }
}

async function inserirFoto(
  db: Client,
  foto: { id: FotoId; legenda: string },
  dono: string | null,
  ordem: number,
  opcoes: { naAbertura?: boolean } = {}
) {
  const [largura, altura] = DIMENSOES[foto.id];
  await db.query(
    `insert into fotos (profissional_id, url, url_grande, largura, altura, legenda, na_abertura, ordem)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [dono, urlPequena(foto.id), urlGrande(foto.id), largura, altura, foto.legenda, opcoes.naAbertura ?? false, ordem]
  );
}

async function cargaInicial(db: Client) {
  const { rows } = await db.query<{ total: number }>("select count(*)::int as total from profissionais");
  if (rows[0].total > 0) {
    console.log("  • Conteúdo já existe no banco: carga inicial ignorada (o painel é a fonte).");
    return;
  }

  for (const [i, p] of profissionais.entries()) {
    await db.query(
      `insert into profissionais (id, nome, especialidade, sobre, tags, instagram, retrato_url, formacao, ordem)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [p.id, p.nome, p.especialidade, p.sobre, p.tags, p.instagram, urlGrande(p.retrato), p.temFormacao ? formacaoGleicy : [], i]
    );
    for (const [j, foto] of p.fotos.entries()) await inserirFoto(db, foto, p.id, j);
  }
  // Fotos de serviço que também entram na galeria da Gleicy.
  await inserirFoto(db, { id: "servico-makes-26", legenda: "Make Luminé" }, "gleicy", 100);
  await inserirFoto(db, { id: "servico-penteado-27", legenda: "Trança com ondas" }, "gleicy", 101);
  // Fotos do espaço: galeria ("Espaço") e esteira da abertura.
  for (const [j, foto] of fotosGerais.entries()) await inserirFoto(db, foto, null, j, { naAbertura: true });

  for (const [i, s] of servicos.entries()) {
    await db.query(
      `insert into servicos (id, nome, descricao, foto_url, rotulo_preco, ordem) values ($1, $2, $3, $4, $5, $6)`,
      [s.id, s.nome, s.descricao, s.foto ? urlPequena(s.foto) : null, s.rotuloPreco ?? null, i]
    );
    for (const prof of atendePor[s.id]) {
      await db.query(`insert into servico_profissional (servico_id, profissional_id) values ($1, $2)`, [s.id, prof]);
    }
  }

  for (const [i, t] of tabelasPreco.entries()) {
    await db.query(`insert into tabelas_preco (id, servico_id, titulo, ordem) values ($1, $2, $3, $4)`, [t.id, t.servicoId, t.titulo, i]);
    for (const prof of t.profissionais) {
      await db.query(`insert into tabela_preco_profissional (tabela_id, profissional_id) values ($1, $2)`, [t.id, prof]);
    }
    for (const [j, item] of t.itens.entries()) {
      await db.query(
        `insert into itens_preco (tabela_id, categoria, nome, tipo, valor, valor_max, duracao_min, obs, adicional, ordem)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [t.id, item.categoria ?? null, item.nome, item.tipo, item.valor ?? null, item.valorMax ?? null,
         item.duracaoMin ?? null, item.obs ?? null, item.adicional ?? false, j]
      );
    }
  }
  console.log(
    `  ✓ Carga inicial: ${profissionais.length} profissionais, ${servicos.length} serviços, ` +
      `${tabelasPreco.length} tabelas de preço, ${tabelasPreco.reduce((n, t) => n + t.itens.length, 0)} itens.`
  );
}

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL não está definido em .env.local");

  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    await db.query("begin");
    console.log("Aplicando migrações…");
    await aplicarMigracoes(db);
    console.log("Conteúdo…");
    await cargaInicial(db);
    await db.query("commit");
    console.log("Pronto.");
  } catch (erro) {
    await db.query("rollback");
    throw erro;
  } finally {
    await db.end();
  }
}

main().catch((erro: Error) => {
  // Nunca imprime a URL de conexão (ela contém a senha do banco).
  console.error("Falha na migração:", erro.message.replace(/postgres(ql)?:\/\/\S+/g, "<url do banco>"));
  process.exit(1);
});
