"use client";

import type { ItemPreco, TabelaPreco, TipoPreco } from "@/lib/tipos";

export type ProfissionalChip = { id: string; nome: string; retrato: string | null };
type Props = {
  tabela: TabelaPreco;
  profissionais: ProfissionalChip[];
  aoMudar: (tabela: TabelaPreco) => void; // o estado fica na página (rascunho + Salvar único)
  aoPedirRemocao: () => void;
};

const TIPOS: { valor: TipoPreco; rotulo: string }[] = [
  { valor: "fixo", rotulo: "Fixo" },
  { valor: "a_partir", rotulo: "A partir de" },
  { valor: "faixa", rotulo: "Faixa" },
  { valor: "consulta", rotulo: "Sob consulta" },
];

const itemVazio = (categoria: string | null): ItemPreco => ({
  nome: "", tipo: "fixo", valor: null, valorMax: null, duracaoMin: null, obs: null, adicional: false, categoria,
});
const numeroOuNulo = (v: string) => (v === "" ? null : Number(v));

/** Profissionais da tabela: foto + nome; marcada fica verde, desmarcada fica cinza. */
export function ChipsProfissionais({ profissionais, marcadas, aoMudar, nome }: {
  profissionais: ProfissionalChip[]; marcadas: string[]; aoMudar: (ids: string[]) => void; nome: string;
}) {
  return (
    <div className="p-chips-prof" role="group" aria-label="Profissionais">
      {profissionais.map((p) => {
        const marcada = marcadas.includes(p.id);
        return (
          <label key={p.id} className="p-chip-prof">
            <input type="checkbox" name={nome} value={p.id} checked={marcada}
              onChange={() => aoMudar(marcada ? marcadas.filter((x) => x !== p.id) : [...marcadas, p.id])} />
            <span className="p-chip-foto" aria-hidden="true">{p.retrato ? <img src={p.retrato} alt="" /> : p.nome[0]}</span>
            {p.nome}
          </label>
        );
      })}
    </div>
  );
}

// Editor de uma tabela de preços: título, profissionais e itens. Não salva sozinho.
export default function EditorTabela({ tabela, profissionais, aoMudar, aoPedirRemocao }: Props) {
  const { itens } = tabela;
  const mudarTabela = (campos: Partial<TabelaPreco>) => aoMudar({ ...tabela, ...campos });
  const mudar = (i: number, campo: Partial<ItemPreco>) =>
    mudarTabela({ itens: itens.map((item, j) => (j === i ? { ...item, ...campo } : item)) });
  const mover = (i: number, d: -1 | 1) => {
    const nova = [...itens];
    [nova[i], nova[i + d]] = [nova[i + d], nova[i]];
    mudarTabela({ itens: nova });
  };

  return (
    <section className="p-tabela">
      <div className="p-tabela-cab">
        <input className="p-titulo" value={tabela.titulo} aria-label="Título da tabela" onChange={(e) => mudarTabela({ titulo: e.target.value })} />
        <ChipsProfissionais profissionais={profissionais} marcadas={tabela.profissionais} nome={`profs-${tabela.id}`}
          aoMudar={(ids) => mudarTabela({ profissionais: ids })} />
      </div>

      <ol className="p-itens">
        {itens.map((item, i) => {
          const id = `${tabela.id}-${i}`;
          return (
            <li className="p-item" key={i}>
              {/* Barra do item: número (posição no site) à esquerda, ordenar/remover à direita. */}
              <div className="p-item-topo">
                <span className="p-item-num" aria-label={`Item ${i + 1}`}>{i + 1}</span>
                <span className="p-item-acoes">
                  <button type="button" aria-label={`Subir ${item.nome}`} disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                  <button type="button" aria-label={`Descer ${item.nome}`} disabled={i === itens.length - 1} onClick={() => mover(i, 1)}>↓</button>
                  <button type="button" className="remover" aria-label={`Remover ${item.nome}`}
                    onClick={() => mudarTabela({ itens: itens.filter((_, j) => j !== i) })}>×</button>
                </span>
              </div>
              <div className="campo p-item-nome">
                <label htmlFor={`${id}-nome`}>Serviço</label>
                <input id={`${id}-nome`} value={item.nome} placeholder="Nome do serviço" onChange={(e) => mudar(i, { nome: e.target.value })} />
              </div>
              <div className="p-item-campos">
                <div className="campo">
                  <label htmlFor={`${id}-tipo`}>Preço</label>
                  <select id={`${id}-tipo`} value={item.tipo} onChange={(e) => mudar(i, { tipo: e.target.value as TipoPreco })}>
                    {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
                  </select>
                </div>
                {item.tipo !== "consulta" && (
                  <div className="campo">
                    <label htmlFor={`${id}-valor`}>{item.tipo === "faixa" ? "De (R$)" : "Valor (R$)"}</label>
                    <input id={`${id}-valor`} type="number" inputMode="numeric" min={0} step="1" value={item.valor ?? ""}
                      onChange={(e) => mudar(i, { valor: numeroOuNulo(e.target.value) })} />
                  </div>
                )}
                {item.tipo === "faixa" && (
                  <div className="campo">
                    <label htmlFor={`${id}-max`}>Até (R$)</label>
                    <input id={`${id}-max`} type="number" inputMode="numeric" min={0} step="1" value={item.valorMax ?? ""}
                      onChange={(e) => mudar(i, { valorMax: numeroOuNulo(e.target.value) })} />
                  </div>
                )}
                <div className="campo">
                  <label htmlFor={`${id}-dur`}>Duração (min)</label>
                  <input id={`${id}-dur`} type="number" inputMode="numeric" min={5} step="5" value={item.duracaoMin ?? ""}
                    onChange={(e) => mudar(i, { duracaoMin: numeroOuNulo(e.target.value) })} />
                </div>
                <div className="campo">
                  <label htmlFor={`${id}-cat`}>Grupo</label>
                  <input id={`${id}-cat`} value={item.categoria ?? ""} placeholder="Ex.: Cílios" onChange={(e) => mudar(i, { categoria: e.target.value || null })} />
                </div>
                <div className="campo p-item-obs">
                  <label htmlFor={`${id}-obs`}>Observação</label>
                  <input id={`${id}-obs`} value={item.obs ?? ""} placeholder="Ex.: inclui retorno" onChange={(e) => mudar(i, { obs: e.target.value || null })} />
                </div>
              </div>
              <label className="p-check">
                <input type="checkbox" checked={item.adicional} onChange={(e) => mudar(i, { adicional: e.target.checked })} />
                <span>
                  <strong>Item adicional</strong> (ex.: conserto de 1 unha): fica fora do “a partir de R$…” mostrado no cartão do serviço
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      <div className="p-acoes">
        <button className="botao botao--linha" type="button"
          onClick={() => mudarTabela({ itens: [...itens, itemVazio(itens.at(-1)?.categoria ?? null)] })}>
          + Adicionar serviço
        </button>
        <button className="botao botao--perigo" type="button" onClick={aoPedirRemocao}>Apagar tabela</button>
      </div>
    </section>
  );
}
