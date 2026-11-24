import { contato } from "@/content";

// Mensagens prontas que a profissional envia à cliente pelo WhatsApp, a partir do painel.

export type DadosMensagem = {
  nomeCliente: string;
  codigo: string;
  servico: string;
  profissional: string | null;
  data: string; // AAAA-MM-DD
  hora: string; // HH:MM
};

export const dataPorExtenso = (dataIso: string) =>
  new Date(`${dataIso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

const primeiroNome = (nome: string) => nome.split(" ")[0];

export function mensagemParaCliente(status: string, d: DadosMensagem): string {
  const quem = d.profissional ? `${d.profissional}, do Luminé Beauty Club` : "a equipe do Luminé Beauty Club";
  const quando = `${dataPorExtenso(d.data)}, às ${d.hora}`;
  const saudacao = `Olá, ${primeiroNome(d.nomeCliente)}! Aqui é ${quem}.`;

  if (status === "confirmado") {
    return `${saudacao}\nSeu horário de ${d.servico} está CONFIRMADO para ${quando} (pedido ${d.codigo}).\n` +
      `Endereço: ${contato.endereco}, ${contato.cidade}.\nAté lá! 💛`;
  }
  if (status === "recusado" || status === "cancelado") {
    return `${saudacao}\nInfelizmente não conseguiremos atender o pedido ${d.codigo} (${d.servico} em ${quando}).\n` +
      `Podemos combinar outro horário?`;
  }
  return `${saudacao}\nRecebemos seu pedido ${d.codigo}: ${d.servico} em ${quando}. Vamos conversar sobre os detalhes?`;
}
