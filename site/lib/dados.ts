import "server-only";
import * as conteudo from "@/content";
import { clientePublico } from "./supabase";
import type { DadosSite, Foto, FotoGaleria, Profissional, Servico, TabelaPreco, TipoPreco } from "./tipos";

// ---------- Linhas como vêm do banco (snake_case) ----------
type LinhaFoto = {
  id: string; profissional_id: string | null; url: string; url_grande: string; largura: number; altura: number;
  legenda: string; na_galeria: boolean; na_abertura: boolean; ordem: number;
};
type LinhaProfissional = {
  id: string; nome: string; especialidade: string; sobre: string; tags: string[]; instagram: string | null;
  whatsapp: string | null; retrato_url: string | null; formacao: string[]; fotos: LinhaFoto[];
};
type LinhaServico = {
  id: string; nome: string; descricao: string; foto_url: string | null; rotulo_preco: string | null;
  servico_profissional: { profissional_id: string }[];
};
type LinhaItem = {
  nome: string; tipo: TipoPreco; valor: string | null; valor_max: string | null; duracao_min: number | null;
  obs: string | null; adicional: boolean; categoria: string | null; ordem: number;
};
type LinhaTabela = {
  id: string; servico_id: string; titulo: string;
  tabela_preco_profissional: { profissional_id: string }[]; itens_preco: LinhaItem[];
};

const paraFoto = (f: LinhaFoto): Foto => ({
  id: f.id, url: f.url, urlGrande: f.url_grande, largura: f.largura, altura: f.altura, legenda: f.legenda,
});
const numero = (v: string | null) => (v == null ? null : Number(v)); // numeric chega como texto

/** Intercala as categorias da galeria para não ficarem todas as fotos de uma pessoa juntas. */
function misturar<T>(lista: T[]): T[] {
  return lista
    .map((item, i) => ({ item, chave: (i * 7) % lista.length }))
    .sort((a, b) => a.chave - b.chave)
    .map((x) => x.item);
}

async function carregarDoBanco(): Promise<DadosSite> {
  const db = clientePublico();
  const [profs, servs, tabs, espaco] = await Promise.all([
    db.from("profissionais").select("*, fotos(*)").eq("ativo", true).order("ordem").order("ordem", { referencedTable: "fotos" }),
    db.from("servicos").select("*, servico_profissional(profissional_id)").order("ordem"),
    db.from("tabelas_preco").select("*, tabela_preco_profissional(profissional_id), itens_preco(*)").order("ordem")
      .order("ordem", { referencedTable: "itens_preco" }),
    db.from("fotos").select("*").is("profissional_id", null).order("ordem"),
  ]);
  const erro = profs.error ?? servs.error ?? tabs.error ?? espaco.error;
  if (erro) throw new Error(erro.message);

  const linhasProf = profs.data as LinhaProfissional[];
  const profissionais: Profissional[] = linhasProf.map((p) => ({
    id: p.id, nome: p.nome, especialidade: p.especialidade, sobre: p.sobre, tags: p.tags, instagram: p.instagram,
    whatsapp: p.whatsapp, retratoUrl: p.retrato_url, formacao: p.formacao, fotos: p.fotos.map(paraFoto),
  }));
  const servicos: Servico[] = (servs.data as LinhaServico[]).map((s) => ({
    id: s.id, nome: s.nome, descricao: s.descricao, fotoUrl: s.foto_url, rotuloPreco: s.rotulo_preco,
    profissionais: s.servico_profissional.map((x) => x.profissional_id),
  }));
  const tabelas: TabelaPreco[] = (tabs.data as LinhaTabela[]).map((t) => ({
    id: t.id, servicoId: t.servico_id, titulo: t.titulo,
    profissionais: t.tabela_preco_profissional.map((x) => x.profissional_id),
    itens: t.itens_preco.map((i) => ({
      nome: i.nome, tipo: i.tipo, valor: numero(i.valor), valorMax: numero(i.valor_max), duracaoMin: i.duracao_min,
      obs: i.obs, adicional: i.adicional, categoria: i.categoria,
    })),
  }));
  const fotosEspaco = espaco.data as LinhaFoto[];
  const galeria: FotoGaleria[] = misturar([
    ...linhasProf.flatMap((p) => p.fotos.filter((f) => f.na_galeria).map((f) => ({ ...paraFoto(f), categoria: p.id }))),
    ...fotosEspaco.filter((f) => f.na_galeria).map((f) => ({ ...paraFoto(f), categoria: "geral" })),
  ]);
  const fotosAbertura = [...linhasProf.flatMap((p) => p.fotos), ...fotosEspaco].filter((f) => f.na_abertura).map(paraFoto);

  return { profissionais, servicos, tabelas, fotosAbertura, galeria, origem: "banco" };
}

/** Converte o conteúdo estático (content.ts) para o mesmo formato do banco. */
function carregarReserva(): DadosSite {
  const foto = (f: conteudo.Foto): Foto => {
    const [largura, altura] = conteudo.DIMENSOES[f.id];
    return { id: f.id, url: `/img/${f.id}-480.webp`, urlGrande: `/img/${f.id}-960.webp`, largura, altura, legenda: f.legenda };
  };
  const profissionais: Profissional[] = conteudo.profissionais.map((p) => ({
    id: p.id, nome: p.nome, especialidade: p.especialidade, sobre: p.sobre, tags: p.tags, instagram: p.instagram,
    whatsapp: null, retratoUrl: `/img/${p.retrato}-960.webp`, formacao: p.temFormacao ? conteudo.formacaoGleicy : [],
    fotos: p.fotos.map(foto),
  }));
  const servicos: Servico[] = conteudo.servicos.map((s) => ({
    id: s.id, nome: s.nome, descricao: s.descricao, fotoUrl: s.foto ? `/img/${s.foto}-480.webp` : null,
    rotuloPreco: s.rotuloPreco ?? null, profissionais: conteudo.atendePor[s.id],
  }));
  const tabelas: TabelaPreco[] = conteudo.tabelasPreco.map((t) => ({
    id: t.id, servicoId: t.servicoId, titulo: t.titulo, profissionais: t.profissionais,
    itens: t.itens.map((i) => ({
      nome: i.nome, tipo: i.tipo, valor: i.valor ?? null, valorMax: i.valorMax ?? null, duracaoMin: i.duracaoMin ?? null,
      obs: i.obs ?? null, adicional: i.adicional ?? false, categoria: i.categoria ?? null,
    })),
  }));
  const espaco = conteudo.fotosGerais.map(foto);
  const galeria = misturar<FotoGaleria>([
    ...profissionais.flatMap((p) => p.fotos.map((f) => ({ ...f, categoria: p.id }))),
    ...espaco.map((f) => ({ ...f, categoria: "geral" })),
  ]);
  return { profissionais, servicos, tabelas, fotosAbertura: espaco, galeria, origem: "reserva" };
}

/**
 * Dados da página inicial. Lê do Supabase; se o banco estiver fora do ar ou mal
 * configurado, registra o erro e usa o conteúdo estático para o site nunca cair.
 */
export async function carregarSite(): Promise<DadosSite> {
  try {
    return await carregarDoBanco();
  } catch (erro) {
    console.error("[dados] Banco indisponível, usando conteúdo de reserva:", (erro as Error).message);
    return carregarReserva();
  }
}
