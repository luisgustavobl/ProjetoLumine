import type { Metadata } from "next";
import { contato } from "@/content";
import { AGENDAMENTO_ONLINE } from "@/lib/recursos";

export const metadata: Metadata = {
  title: "Aviso de privacidade · Luminé Beauty Club",
  description: "Como o Luminé Beauty Club trata os dados pessoais enviados pelo site (LGPD).",
};

// Aviso de privacidade exigido pela LGPD (Lei 13.709/2018).
// O texto depende de o agendamento online estar ligado (grava dados) ou não (só WhatsApp).
export default function Privacidade() {
  return AGENDAMENTO_ONLINE ? <AvisoAgendamentoOnline /> : <AvisoWhatsapp />;
}

/** Cabeçalho e contato comuns às duas versões. */
function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <main className="pagina-texto">
      <div className="wrap">
        <a className="voltar" href="/">← Voltar ao site</a>
        <p className="sobre">LGPD</p>
        <h1>Aviso de privacidade</h1>
        <p className="nota">Última atualização: novembro de 2026.</p>
        {children}
        <h2>Responsável e contato</h2>
        <p>
          Luminé Beauty Club, {contato.endereco}, {contato.cidade}. Dúvidas ou pedidos sobre seus dados: WhatsApp ou Instagram{" "}
          <a href={`https://instagram.com/${contato.instagram}`} target="_blank" rel="noopener noreferrer">@{contato.instagram}</a>.
        </p>
      </div>
    </main>
  );
}

const MAPA = (
  <p>O mapa da seção de contato é do Google Maps e segue a política de privacidade do Google.</p>
);

/** Agendamento por WhatsApp: o site não guarda dados de clientes. */
function AvisoWhatsapp() {
  return (
    <Pagina>
      <h2>Dados</h2>
      <p>
        O formulário de agendamento não envia nem guarda o que você preenche. Ele monta a mensagem no seu aparelho e abre o
        WhatsApp da profissional; você decide se envia.
      </p>
      <h2>Cookies</h2>
      <p>Não usamos cookies de rastreamento nem de publicidade.</p>
      {MAPA}
      <h2>WhatsApp</h2>
      <p>A conversa segue as regras do WhatsApp. Usamos seu nome e número apenas para combinar o atendimento.</p>
    </Pagina>
  );
}

/** Agendamento online ligado: pedidos ficam gravados no banco. */
function AvisoAgendamentoOnline() {
  return (
    <Pagina>
      <h2>Dados</h2>
      <p>
        Guardamos o que você preenche no pedido (nome, WhatsApp, serviço, profissional, data, horário e observações) e quando
        aceitou este aviso, só para responder ao pedido. Não enviamos propaganda nem compartilhamos seus dados.
      </p>
      <h2>Base legal</h2>
      <p>Consentimento e procedimentos antes da prestação do serviço (art. 7º, I e V, da LGPD).</p>
      <h2>Armazenamento</h2>
      <p>
        Em servidor no Brasil (São Paulo). Pedidos recusados ou cancelados são apagados após 30 dias; os demais, 180 dias
        depois do atendimento.
      </p>
      <h2>Cookies</h2>
      <p>Não usamos cookies de rastreamento nem de publicidade.</p>
      {MAPA}
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir para ver, corrigir ou apagar seus dados e retirar o consentimento (art. 18 da LGPD), informando o
        código do pedido. Também pode reclamar à ANPD.
      </p>
    </Pagina>
  );
}
