import AbasFotos from "@/components/painel/AbasFotos";
import GradeFotos, { type FotoPainel } from "@/components/painel/GradeFotos";
import { clienteSessao } from "@/lib/sessao";

type LinhaFoto = { id: string; url: string; url_grande: string; legenda: string; na_galeria: boolean; na_abertura: boolean };


export default async function Fotos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const db = await clienteSessao();
  const { data: profs, error } = await db.from("profissionais").select("id, nome, retrato_url").order("ordem");
  if (error) throw new Error(error.message);

  const abas: { id: string; nome: string; retrato?: string | null }[] = [
    ...(profs ?? []).map((p) => ({ id: p.id as string, nome: p.nome as string, retrato: p.retrato_url as string | null })),
    { id: "espaco", nome: "Espaço" },
  ];
  const atual = abas.find((a) => a.id === aba) ?? abas[0];
  const dono = atual.id === "espaco" ? null : atual.id;

  let consulta = db.from("fotos").select("id, url, url_grande, legenda, na_galeria, na_abertura").order("ordem");
  consulta = dono ? consulta.eq("profissional_id", dono) : consulta.is("profissional_id", null);
  const { data: linhas, error: erroFotos } = await consulta;
  if (erroFotos) throw new Error(erroFotos.message);

  const fotos: FotoPainel[] = ((linhas ?? []) as LinhaFoto[]).map((f) => ({
    id: f.id, url: f.url, urlGrande: f.url_grande, legenda: f.legenda, naGaleria: f.na_galeria, naAbertura: f.na_abertura,
  }));
  const retrato = (profs ?? []).find((p) => p.id === dono)?.retrato_url ?? null;

  return (
    <>
      <header className="p-cab">
        <h1>Fotos</h1>
        <p className="nota">Gerencie as fotos do carrossel de cada profissional e também as do espaço ou site.</p>
      </header>
      <AbasFotos abas={abas} atual={atual.id}>
        <section className="p-bloco">
          {/* key: ao trocar de aba, o componente recomeça do zero */}
          <GradeFotos key={atual.id} dono={dono} nomeDono={atual.nome} fotos={fotos} retratoUrl={retrato} />
        </section>
      </AbasFotos>
    </>
  );
}
