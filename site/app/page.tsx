import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import Servicos from "@/components/Servicos";
import Profissionais from "@/components/Profissionais";
import Galeria, { type FotoGaleria } from "@/components/Galeria";
import Depoimentos from "@/components/Depoimentos";
import Agendamento from "@/components/Agendamento";
import { contato, fotosGerais, profissionais, servicos, tabelasPreco, type FotoId } from "@/content";
import { atributosFoto } from "@/lib/util";

// Abertura "esteira reduzida": só fotos do espaço, repetidas para cobrir telas largas.
const fotosEsteira: FotoId[] = [...fotosGerais, ...fotosGerais, ...fotosGerais].map((f) => f.id);

// Galeria: tudo menos retratos, com as categorias intercaladas.
const todasFotos: FotoGaleria[] = [
  ...profissionais.flatMap((p) => p.fotos.map((f) => ({ ...f, categoria: p.id as string }))),
  ...fotosGerais.map((f) => ({ ...f, categoria: "geral" })),
  { id: "servico-makes-26", legenda: "Make Luminé", categoria: "gleicy" },
  { id: "servico-penteado-27", legenda: "Trança com ondas", categoria: "gleicy" },
];
const fotosGaleria = todasFotos
  .map((f, i) => ({ f, ordem: (i * 7) % todasFotos.length }))
  .sort((a, b) => a.ordem - b.ordem)
  .map((x) => x.f);

const enderecoCompleto = `${contato.endereco}, ${contato.cidade}`;

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section id="inicio" className="hero">
          <div className="wrap hero-txt">
            <h1 className="hero-logo">
              <Logo comSubtitulo className="hero-svg" />
            </h1>
            <p className="slogan">
              Maquiagem, penteados, nails, estética e tattoo em um só espaço na Praia de Iracema. Atendimento com hora marcada e
              cursos para quem quer aprender.
            </p>
            <div className="hero-acoes">
              <a className="botao" href="#contato">Agendar horário</a>
              <a className="botao botao--linha" href="#profissionais">Conhecer a equipe</a>
            </div>
          </div>
          <div className="hero-fotos" aria-hidden="true">
            <div className="esteira" style={{ ["--dur" as string]: `${fotosEsteira.length * 30}s` }}>
              {[...fotosEsteira, ...fotosEsteira].map((id, i) => (
                <img
                  key={i}
                  {...atributosFoto(id, "(max-width:700px) 58vw, 26vw")}
                  alt=""
                  fetchPriority={i < 4 ? "high" : undefined}
                  loading={i < 4 ? undefined : "lazy"}
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </section>

        <section id="servicos" className="secao">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">O que fazemos</p>
              <h2>Serviços</h2>
              <p className="intro">Toque em um serviço para ver a tabela de preços.</p>
            </div>
            <Servicos servicos={servicos} tabelas={tabelasPreco} />
          </div>
        </section>

        <section id="profissionais" className="secao secao--clara">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Quem somos</p>
              <h2>Profissionais</h2>
            </div>
            <Profissionais lista={profissionais} />
          </div>
        </section>

        <section id="galeria" className="secao">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Portfólio</p>
              <h2>Galeria</h2>
            </div>
            <Galeria fotos={fotosGaleria} />
          </div>
        </section>

        <section id="depoimentos" className="secao secao--clara">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Quem já passou por aqui</p>
              <h2>Depoimentos</h2>
            </div>
            <Depoimentos />
          </div>
        </section>

        <section id="contato" className="secao">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Vamos conversar</p>
              <h2>Contato</h2>
            </div>
            <div className="contato">
              <div className="info">
                <p>
                  <strong>Endereço</strong>
                  {contato.endereco}
                  <br />
                  {contato.cidade}
                </p>
                <p>
                  <strong>Horário</strong>
                  {contato.horario}
                </p>
                <p>
                  <strong>Instagram</strong>
                  <a href={`https://instagram.com/${contato.instagram}`} target="_blank" rel="noopener noreferrer">
                    @{contato.instagram}
                  </a>
                </p>
                <p>
                  <strong>WhatsApp</strong>
                  {contato.whatsappAreas.map((w) => (
                    <a key={w.link} className="link-linha" href={w.link} target="_blank" rel="noopener noreferrer">
                      {w.area} ↗
                    </a>
                  ))}
                </p>
                <p>
                  <a href={contato.googleMaps} target="_blank" rel="noopener noreferrer">
                    Ver no Google Maps · {contato.notaGoogle} ★ ({contato.avaliacoesGoogle} avaliações) ↗
                  </a>
                </p>
                <iframe
                  className="mapa"
                  title={`Mapa: ${enderecoCompleto}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <Agendamento />
            </div>
            <p className="aviso">Depoimentos e nota vêm do Google.</p>
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="wrap">
          <p className="logo">
            <Logo comSubtitulo className="rodape-svg" />
          </p>
          <p>{contato.endereco} · Fortaleza – CE</p>
          <p className="rodape-copy">© {new Date().getFullYear()} Luminé Beauty Club · Gleicy Lima</p>
        </div>
      </footer>
    </>
  );
}
