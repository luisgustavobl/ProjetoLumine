import EditorPrecos from "@/components/painel/EditorPrecos";
import { clienteSessao } from "@/lib/sessao";
import type { TabelaPreco, TipoPreco } from "@/lib/tipos";

type LinhaItem = {
  nome: string; tipo: TipoPreco; valor: string | null; valor_max: string | null; duracao_min: number | null;
  obs: string | null; adicional: boolean; categoria: string | null;
};

export default async function Precos() {
  const db = await clienteSessao();
  const [tabelas, servicos, profissionais] = await Promise.all([
    db.from("tabelas_preco").select("*, tabela_preco_profissional(profissional_id), itens_preco(*)").order("ordem")
      .order("ordem", { referencedTable: "itens_preco" }),
    db.from("servicos").select("id, nome, descricao, foto_url").order("ordem"),
    db.from("profissionais").select("id, nome, retrato_url").eq("ativo", true).order("ordem"),
  ]);
  const erro = tabelas.error ?? servicos.error ?? profissionais.error;
  if (erro) throw new Error(erro.message);

  const listaServicos = (servicos.data ?? []).map((s) => ({ id: s.id, nome: s.nome, descricao: s.descricao, fotoUrl: s.foto_url }));
  const listaProfs = (profissionais.data ?? []).map((p) => ({ id: p.id as string, nome: p.nome as string, retrato: p.retrato_url as string | null }));
  const lista: TabelaPreco[] = (tabelas.data ?? []).map((t) => ({
    id: t.id, servicoId: t.servico_id, titulo: t.titulo,
    profissionais: (t.tabela_preco_profissional as { profissional_id: string }[]).map((x) => x.profissional_id),
    itens: (t.itens_preco as LinhaItem[]).map((i) => ({
      nome: i.nome, tipo: i.tipo, valor: i.valor == null ? null : Number(i.valor), valorMax: i.valor_max == null ? null : Number(i.valor_max),
      duracaoMin: i.duracao_min, obs: i.obs, adicional: i.adicional, categoria: i.categoria,
    })),
  }));

  return (
    <>
      <header className="p-cab">
        <h1>Preços</h1>
        <p className="nota">Mude o que precisar e toque em <strong>Salvar</strong>. Assim que salvar, o valor no site é atualizado automaticamente.</p>
        <p className="nota">Para alterar a ordem no site use as setinhas.</p>
      </header>
      <EditorPrecos servicos={listaServicos} tabelas={lista} profissionais={listaProfs} />
    </>
  );
}
