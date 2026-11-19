import type { Metadata } from "next";
import { contato } from "@/content";

export const metadata: Metadata = {
  title: "Aviso de privacidade · Luminé Beauty Club",
  description: "Como o Luminé Beauty Club trata os dados pessoais enviados pelo site (LGPD).",
};

// Aviso de privacidade exigido pela LGPD (Lei 13.709/2018) para o formulário de agendamento.
export default function Privacidade() {
  return (
    <main className="pagina-texto">
      <div className="wrap">
        <a className="voltar" href="/">← Voltar ao site</a>
        <p className="sobre">LGPD</p>
        <h1>Aviso de privacidade</h1>
        <p className="nota">Última atualização: novembro de 2026.</p>

        <h2>Quem cuida dos seus dados</h2>
        <p>
          Luminé Beauty Club ({contato.endereco}, {contato.cidade}), responsável por Gleicy Lima, é quem decide como os
          dados enviados por este site são usados (controlador, na linguagem da LGPD).
        </p>

        <h2>Quais dados coletamos</h2>
        <p>
          Apenas o que você preenche no pedido de agendamento: <strong>nome, WhatsApp, serviço, profissional, data,
          horário e observações</strong>. Também registramos a data e a hora em que você aceitou este aviso. Não usamos
          cookies de rastreamento nem ferramentas de publicidade.
        </p>

        <h2>Para que usamos</h2>
        <p>
          Somente para responder e organizar o seu pedido: confirmar ou recusar o horário e combinar os detalhes com você
          pelo WhatsApp. Não enviamos propaganda e não vendemos nem compartilhamos seus dados com terceiros para outros fins.
        </p>

        <h2>Base legal</h2>
        <p>
          O tratamento é feito com o seu <strong>consentimento</strong> (art. 7º, I) e para atender a um pedido seu antes da
          prestação do serviço (art. 7º, V, da LGPD).
        </p>

        <h2>Onde ficam e por quanto tempo</h2>
        <p>
          Os pedidos são guardados em banco de dados no Brasil (Supabase, região São Paulo), com acesso restrito à equipe
          por login e senha. Apagamos automaticamente os pedidos <strong>recusados ou cancelados após 30 dias</strong> e os
          demais <strong>180 dias depois da data do atendimento</strong>.
        </p>
        <p>
          Se você escolher continuar a conversa pelo WhatsApp, a mensagem passa a seguir também as regras do próprio WhatsApp.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Você pode, a qualquer momento, pedir para <strong>ver, corrigir ou apagar</strong> seus dados e retirar o
          consentimento (art. 18 da LGPD). Basta falar com a equipe pelo WhatsApp ou pelo Instagram{" "}
          <a href={`https://instagram.com/${contato.instagram}`} target="_blank" rel="noopener noreferrer">@{contato.instagram}</a>,
          informando o código do pedido. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </div>
    </main>
  );
}
