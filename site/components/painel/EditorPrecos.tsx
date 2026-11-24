"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { salvarPrecos, trocarFotoServico, type AlteracoesPrecos } from "@/app/painel/(logado)/acoes-precos";
import Modal from "@/components/Modal";
import type { TabelaPreco } from "@/lib/tipos";
import EditorTabela, { ChipsProfissionais, type ProfissionalChip } from "./EditorTabela";
import ConfirmarApagar from "./ConfirmarApagar";
import TrocarFoto from "./TrocarFoto";

type ServicoBase = { id: string; nome: string; descricao: string; fotoUrl: string | null };
type Servico = Omit<ServicoBase, "fotoUrl"> & { novo?: true }; // a foto não entra no rascunho (troca na hora)
type Tabela = TabelaPreco & { nova?: true; removida?: true };
type Estado = { servicos: Servico[]; tabelas: Tabela[] };
type Props = { servicos: ServicoBase[]; tabelas: TabelaPreco[]; profissionais: ProfissionalChip[] };

const CHAVE_RASCUNHO = "painel-precos-rascunho";

/** "Unhas em Gel" -> "unhas-em-gel" (id do serviço). */
const slug = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "servico";

const ler = <T,>(chave: string): T | null => {
  try { return JSON.parse(localStorage.getItem(chave) ?? "null") as T | null; } catch { return null; }
};
const gravar = (chave: string, valor: unknown) => {
  try { if (valor == null) localStorage.removeItem(chave); else localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
};

/** Monta o que mudou em relação ao banco, no formato da ação salvarPrecos. */
function diferencas(estado: Estado, base: Estado): AlteracoesPrecos {
  const servicoBase = new Map(base.servicos.map((s) => [s.id, s]));
  const tabelaBase = new Map(base.tabelas.map((t) => [t.id, JSON.stringify(t)]));
  return {
    servicos: estado.servicos
      .filter((s) => s.novo || s.nome !== servicoBase.get(s.id)?.nome || s.descricao !== servicoBase.get(s.id)?.descricao)
      .map((s) => ({ id: s.id, nome: s.nome, descricao: s.descricao, novo: !!s.novo })),
    tabelas: estado.tabelas
      .filter((t) => !t.removida && (t.nova || JSON.stringify(t) !== tabelaBase.get(t.id)))
      .map(({ removida: _, nova, ...t }) => ({ ...t, nova: !!nova })),
    removidas: estado.tabelas.filter((t) => t.removida && !t.nova).map((t) => t.id),
  };
}

// Página de Preços inteira. Nada vai para o banco até tocar em "Salvar";
// enquanto isso, as edições ficam guardadas neste aparelho (sobrevivem a fechar a aba ou cair a internet).
export default function EditorPrecos({ servicos, tabelas, profissionais }: Props) {
  const base: Estado = useMemo(
    () => ({ servicos: servicos.map(({ fotoUrl: _, ...s }) => s), tabelas }),
    [servicos, tabelas],
  );
  const baseJson = JSON.stringify(base);
  const fotos = new Map(servicos.map((s) => [s.id, s.fotoUrl]));

  const [estado, setEstado] = useState<Estado>(base);
  const [pronto, setPronto] = useState(false); // só grava rascunho depois de tentar recuperar o anterior
  const [mensagem, setMensagem] = useState<{ erro?: string; ok?: string }>({});
  const [salvando, iniciar] = useTransition();
  const alterado = JSON.stringify(estado) !== baseJson;

  // Recupera o rascunho deste aparelho, se houver.
  useEffect(() => {
    const rascunho = ler<Estado>(CHAVE_RASCUNHO);
    if (rascunho && JSON.stringify(rascunho) !== baseJson) {
      setEstado(rascunho);
      setMensagem({ ok: "Alterações não salvas recuperadas." });
    }
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda o rascunho a cada mudança.
  useEffect(() => {
    if (pronto) gravar(CHAVE_RASCUNHO, alterado ? estado : null);
  }, [estado, alterado, pronto]);

  // O banco mudou (salvou, ou trocou uma foto): acompanha se não havia edição pendente.
  const baseAnterior = useRef(baseJson);
  const acabouDeSalvar = useRef(false);
  useEffect(() => {
    if (baseJson === baseAnterior.current) return;
    setEstado((atual) => (acabouDeSalvar.current || JSON.stringify(atual) === baseAnterior.current ? base : atual));
    acabouDeSalvar.current = false;
    baseAnterior.current = baseJson;
  }, [base, baseJson]);

  const mudarServico = (id: string, campos: Partial<Servico>) =>
    setEstado((e) => ({ ...e, servicos: e.servicos.map((s) => (s.id === id ? { ...s, ...campos } : s)) }));
  const mudarTabela = (t: Tabela) => setEstado((e) => ({ ...e, tabelas: e.tabelas.map((x) => (x.id === t.id ? t : x)) }));
  const marcarRemovida = (id: string, removida: boolean) =>
    setEstado((e) => ({
      ...e,
      tabelas: e.tabelas
        .filter((t) => !(removida && t.id === id && t.nova)) // tabela nova ainda não salva: some de vez
        .map((t) => {
          if (t.id !== id) return t;
          const { removida: _, ...resto } = t;
          return removida ? { ...resto, removida: true as const } : resto;
        }),
    }));

  function salvar() {
    setMensagem({});
    iniciar(async () => {
      acabouDeSalvar.current = true;
      const r = await salvarPrecos(diferencas(estado, base));
      if (r.erro) acabouDeSalvar.current = false;
      else gravar(CHAVE_RASCUNHO, null);
      setMensagem(r);
    });
  }

  function descartar() {
    if (!confirm("Descartar todas as alterações não salvas?")) return;
    setEstado(base);
    setMensagem({});
  }

  // --- popups ---
  const [novoServico, setNovoServico] = useState(false);
  const [novaTabelaEm, setNovaTabelaEm] = useState<Servico | null>(null);
  const [profsNova, setProfsNova] = useState<string[]>([]);
  const [apagar, setApagar] = useState<Tabela | null>(null);

  function adicionarServico(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const nome = String(dados.get("nome")).trim();
    const ids = new Set(estado.servicos.map((s) => s.id));
    let id = slug(nome);
    for (let n = 2; ids.has(id); n++) id = `${slug(nome)}-${n}`;
    setEstado((atual) => ({
      ...atual,
      servicos: [...atual.servicos, { id, nome, descricao: String(dados.get("descricao")).trim(), novo: true }],
    }));
    setNovoServico(false);
  }

  function adicionarTabela(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!novaTabelaEm || !profsNova.length) return;
    const titulo = String(new FormData(e.currentTarget).get("titulo")).trim();
    const nova: Tabela = {
      id: `${novaTabelaEm.id}-${Date.now().toString(36)}`, servicoId: novaTabelaEm.id, titulo,
      profissionais: profsNova, itens: [], nova: true,
    };
    setEstado((atual) => ({ ...atual, tabelas: [...atual.tabelas, nova] }));
    setNovaTabelaEm(null);
  }

  return (
    <>
      <div className="p-novo">
        <button type="button" className="botao" onClick={() => setNovoServico(true)}>+ Novo serviço</button>
      </div>
      {mensagem.erro && !alterado && <p className="erro" role="alert">{mensagem.erro}</p>}
      {mensagem.ok && <p className="p-ok" role="status">{mensagem.ok}</p>}

      <div className="p-pilha">
        {estado.servicos.map((s) => {
          const doServico = estado.tabelas.filter((t) => t.servicoId === s.id);
          return (
            <section key={s.id} className="p-servico" aria-label={s.nome}>
              <header className="p-servico-cab">
                {s.novo ? (
                  <div className="p-foto-unica"><div className="p-foto-unica-img"><span>Foto após salvar</span></div></div>
                ) : (
                  <TrocarFoto id={s.id} pasta="servicos" urlAtual={fotos.get(s.id) ?? null}
                    rotulo={`Foto do serviço ${s.nome}`} acao={trocarFotoServico} />
                )}
                <div className="p-servico-textos">
                  <input className="p-servico-nome" value={s.nome} aria-label="Nome do serviço"
                    onChange={(e) => mudarServico(s.id, { nome: e.target.value })} />
                  <input className="p-servico-desc" value={s.descricao} aria-label="Descrição do serviço" placeholder="Descrição"
                    onChange={(e) => mudarServico(s.id, { descricao: e.target.value })} />
                </div>
              </header>

              {doServico.length === 0 && <p className="nota">Sem tabela: o site mostra “sob consulta”.</p>}
              {doServico.map((t) =>
                t.removida ? (
                  <p key={t.id} className="p-removida">
                    “{t.titulo}” será apagada ao salvar.{" "}
                    <button type="button" className="p-link" onClick={() => marcarRemovida(t.id, false)}>Desfazer</button>
                  </p>
                ) : (
                  <EditorTabela key={t.id} tabela={t} profissionais={profissionais}
                    aoMudar={(nova) => mudarTabela({ ...t, ...nova })} aoPedirRemocao={() => setApagar(t)} />
                ),
              )}
              <button type="button" className="botao botao--linha p-nova-tabela"
                onClick={() => { setProfsNova([]); setNovaTabelaEm(s); }}>
                + Nova tabela
              </button>
            </section>
          );
        })}
      </div>

      {alterado && (
        <div className="p-salvar" role="region" aria-label="Alterações não salvas">
          <span>{mensagem.erro ?? "Alterações não salvas"}</span>
          <span className="p-salvar-botoes">
            <button className="botao botao--descartar" type="button" disabled={salvando} onClick={descartar}>Descartar</button>
            <button className="botao" type="button" disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar"}</button>
          </span>
        </div>
      )}

      <Modal aberto={novoServico} aoFechar={() => setNovoServico(false)} rotulo="Novo serviço" className="p-modal">
        <form className="form-box p-form" onSubmit={adicionarServico}>
          <button type="button" className="x" aria-label="Fechar" onClick={() => setNovoServico(false)}>×</button>
          <h3>Novo serviço</h3>
          <div className="campo"><label htmlFor="ns-nome">Nome</label><input id="ns-nome" name="nome" minLength={2} maxLength={40} required /></div>
          <div className="campo"><label htmlFor="ns-desc">Descrição</label><input id="ns-desc" name="descricao" maxLength={120} /></div>
          <button className="botao" type="submit">Adicionar</button>
        </form>
      </Modal>

      <Modal aberto={novaTabelaEm !== null} aoFechar={() => setNovaTabelaEm(null)} rotulo="Nova tabela" className="p-modal">
        <form className="form-box p-form" onSubmit={adicionarTabela}>
          <button type="button" className="x" aria-label="Fechar" onClick={() => setNovaTabelaEm(null)}>×</button>
          <h3>Nova tabela · {novaTabelaEm?.nome}</h3>
          <div className="campo"><label htmlFor="nt-tit">Título</label>
            <input id="nt-tit" name="titulo" placeholder="Ex.: Cursos com Evelyne" required /></div>
          <ChipsProfissionais profissionais={profissionais} marcadas={profsNova} aoMudar={setProfsNova} nome="nt-profs" />
          <button className="botao" type="submit" disabled={!profsNova.length}>Criar tabela</button>
        </form>
      </Modal>

      <Modal aberto={apagar !== null} aoFechar={() => setApagar(null)} rotulo="Apagar tabela" className="p-modal">
        {apagar && (
          <div className="form-box">
            <ConfirmarApagar titulo={`Apagar “${apagar.titulo}”?`} nota="Só será apagada ao salvar."
              aoCancelar={() => setApagar(null)}
              aoConfirmar={() => { marcarRemovida(apagar.id, true); setApagar(null); }} />
          </div>
        )}
      </Modal>
    </>
  );
}
