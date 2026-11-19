import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import Servicos from "@/components/Servicos";
import Profissionais from "@/components/Profissionais";
import Galeria from "@/components/Galeria";
import Depoimentos from "@/components/Depoimentos";
import Agendamento from "@/components/Agendamento";
import { contato } from "@/content";
import { carregarSite } from "@/lib/dados";
import { atributosFoto } from "@/lib/util";

// Conteúdo vem do banco; a página é regerada a cada 60 s (e na hora, quando o painel salva algo).
export const revalidate = 60;

const enderecoCompleto = `${contato.endereco}, ${contato.cidade}`;

export default async function Home() {
  const { profissionais, servicos, tabelas, fotosAbertura, galeria } = await carregarSite();
  // Abertura: fotos repetidas para a esteira cobrir telas largas sem buraco.
  const esteira = [...fotosAbertura, ...fotosAbertura, ...fotosAbertura];

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
            <div className="esteira" style={{ ["--dur" as string]: `${esteira.length * 30}s` }}>
              {[...esteira, ...esteira].map((foto, i) => (
                <img
                  key={i}
                  {...atributosFoto(foto, "(max-width:700px) 58vw, 26vw")}
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
            <Servicos servicos={servicos} tabelas={tabelas} profissionais={profissionais} />
          </div>
        </section>

        <section id="profissionais" className="secao secao--clara">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Quem somos</p>
              <h2>Profissionais</h2>
            </div>
            <Profissionais lista={profissionais} servicos={servicos} />
          </div>
        </section>

        <section id="galeria" className="secao">
          <div className="wrap">
            <div className="cab">
              <p className="sobre">Portfólio</p>
              <h2>Galeria</h2>
            </div>
            <Galeria fotos={galeria} />
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
              <Agendamento servicos={servicos} profissionais={profissionais} />
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
          <p><a href="/privacidade">Aviso de privacidade</a></p>
          <p className="rodape-copy">© {new Date().getFullYear()} Luminé Beauty Club · Gleicy Lima</p>
        </div>
      </footer>
    </>
  );
}
