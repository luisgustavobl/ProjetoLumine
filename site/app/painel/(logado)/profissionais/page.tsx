import Link from "next/link";
import BotaoModal from "@/components/painel/BotaoModal";
import FormAcao from "@/components/painel/FormAcao";
import TrocarFoto from "@/components/painel/TrocarFoto";
import { clienteSessao } from "@/lib/sessao";
import { criarProfissional, salvarProfissional, trocarRetrato } from "../acoes-profissionais";

/** "5585999990000" -> "(85) 99999-0000" para mostrar no campo. */
const telefoneVisivel = (t: string | null) => (t ? t.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3") : "");

type Perfil = {
  nome: string; especialidade: string; whatsapp: string | null; instagram: string | null; sobre: string;
  tags: string[] | null; formacao: string[] | null; ativo: boolean;
};

/** Campos do perfil. Os mesmos servem para editar (com valores) e para cadastrar (vazios). */
function CamposPerfil({ prefixo, perfil, servicos, atende }: {
  prefixo: string; perfil?: Perfil; servicos: { id: string; nome: string }[]; atende: Set<string>;
}) {
  const id = (campo: string) => `${prefixo}-${campo}`;
  return (
    <>
      <div className="p-campos">
        <div className="campo"><label htmlFor={id("nome")}>Nome</label>
          <input id={id("nome")} name="nome" defaultValue={perfil?.nome} required /></div>
        <div className="campo"><label htmlFor={id("especialidade")}>Especialidade</label>
          <input id={id("especialidade")} name="especialidade" defaultValue={perfil?.especialidade} placeholder="Ex.: Sobrancelhas" required /></div>
        <div className="campo"><label htmlFor={id("whatsapp")}>WhatsApp</label>
          <input id={id("whatsapp")} name="whatsapp" type="tel" defaultValue={telefoneVisivel(perfil?.whatsapp ?? null)} placeholder="(85) 9 9999-9999" /></div>
        <div className="campo"><label htmlFor={id("instagram")}>Instagram</label>
          <input id={id("instagram")} name="instagram" defaultValue={perfil?.instagram ?? ""} placeholder="@usuario" /></div>
      </div>
      <div className="campo"><label htmlFor={id("sobre")}>Bio</label>
        <textarea id={id("sobre")} name="sobre" defaultValue={perfil?.sobre} maxLength={400} /></div>
      <div className="campo"><label htmlFor={id("tags")}>Destaques/Tags (separados por vírgula)</label>
        <input id={id("tags")} name="tags" defaultValue={(perfil?.tags ?? []).join(", ")} /></div>
      <div className="campo">
        <label htmlFor={id("formacao")}>Formação (um curso por linha)</label>
        <textarea id={id("formacao")} name="formacao" rows={4} defaultValue={(perfil?.formacao ?? []).join("\n")} />
      </div>
      <fieldset className="p-profs">
        <legend className="nota">Serviços que atende</legend>
        {servicos.map((s) => (
          <label key={s.id} className="p-check">
            <input type="checkbox" name="servicos" value={s.id} defaultChecked={atende.has(s.id)} /> {s.nome}
          </label>
        ))}
      </fieldset>
      {/* Interruptor separado e destacado: decide se a profissional aparece para as clientes. */}
      <label className="p-visivel">
        <input type="checkbox" role="switch" name="ativo" defaultChecked={perfil?.ativo ?? false} />
        <strong>Visível no site</strong>
      </label>
    </>
  );
}

// Perfil de cada profissional: foto, textos do site, Instagram, WhatsApp e serviços.
export default async function Profissionais() {
  const db = await clienteSessao();
  const [profs, servicos, vinculos] = await Promise.all([
    db.from("profissionais").select("*").order("ordem"),
    db.from("servicos").select("id, nome").order("ordem"),
    db.from("servico_profissional").select("*"),
  ]);
  const erro = profs.error ?? servicos.error ?? vinculos.error;
  if (erro) throw new Error(erro.message);
  const listaServicos = servicos.data ?? [];

  return (
    <>
      <header className="p-cab">
        <h1>Profissionais</h1>
        <p className="nota">
          O número de <strong>WhatsApp</strong> de cada profissional, é número do qual o cliente será redirecionado ao clicar em Agendar Serviço no site.
        </p>
        <BotaoModal
          rotuloBotao="+ Cadastrar profissional"
          titulo="Nova profissional"
          descricao="Ela começa escondida do site. Ligue “Visível no site” quando o perfil estiver pronto."
          acao={criarProfissional}
          rotuloEnviar="Cadastrar profissional"
        >
          <CamposPerfil prefixo="nova" servicos={listaServicos} atende={new Set()} />
        </BotaoModal>
      </header>

      <div className="p-pilha">
        {(profs.data ?? []).map((p) => {
          const atende = new Set((vinculos.data ?? []).filter((v) => v.profissional_id === p.id).map((v) => v.servico_id));
          return (
            <section key={p.id} className="p-bloco p-perfil" aria-labelledby={`${p.id}-titulo`}>
              <header className="p-perfil-cab">
                <TrocarFoto id={p.id} pasta="perfis" urlAtual={p.retrato_url}
                  rotulo={`Foto de perfil de ${p.nome}`} acao={trocarRetrato} />
                <div className="p-perfil-nome">
                  <h2 id={`${p.id}-titulo`}>{p.nome}</h2>
                  <p>{p.especialidade}</p>
                  <span className={`p-estado${p.ativo ? " p-estado--on" : ""}`}>{p.ativo ? "Visível no site" : "Escondida do site"}</span>
                </div>
                <Link className="botao botao--linha botao--peq" href={`/painel/fotos?aba=${p.id}`}>Gerenciar fotos</Link>
              </header>
              <FormAcao acao={salvarProfissional.bind(null, p.id)} rotulo="Salvar">
                <CamposPerfil prefixo={p.id} perfil={p} servicos={listaServicos} atende={atende} />
              </FormAcao>
            </section>
          );
        })}
      </div>
    </>
  );
}
