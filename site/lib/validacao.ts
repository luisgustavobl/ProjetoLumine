import { dataMaxima, dataMinima, dataValida, horariosDoDia } from "./agenda";

// Validação do pedido de agendamento. Função pura (sem banco), usada pela API.

export type PedidoValido = {
  nome: string;
  telefone: string; // só dígitos, com DDI 55
  servicoId: string;
  profissionalId: string | null;
  data: string; // AAAA-MM-DD
  hora: string; // HH:MM
  observacoes: string | null;
};

export type ResultadoValidacao = { ok: true; pedido: PedidoValido } | { ok: false; erro: string; campo?: string };

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Aceita "(85) 9 9999-9999", "85999999999" ou "+55 85 99999-9999" e devolve "5585999999999". */
export function normalizarTelefone(bruto: string): string | null {
  let digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 12 || digitos.length === 13) {
    if (!digitos.startsWith("55")) return null;
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null; // DDD + 8 ou 9 dígitos
  if (digitos.startsWith("0")) return null;
  return `55${digitos}`;
}

export function validarPedido(corpo: Record<string, unknown>): ResultadoValidacao {
  const nome = texto(corpo.nome).replace(/\s+/g, " ");
  if (nome.length < 2 || nome.length > 80) return { ok: false, erro: "Escreva seu nome (2 a 80 letras).", campo: "nome" };

  const telefone = normalizarTelefone(texto(corpo.telefone));
  if (!telefone) return { ok: false, erro: "WhatsApp inválido. Use DDD + número, ex.: (85) 9 9999-9999.", campo: "telefone" };

  const servicoId = texto(corpo.servico);
  if (!servicoId) return { ok: false, erro: "Escolha o serviço que você quer agendar.", campo: "servico" };

  const data = texto(corpo.data);
  if (!dataValida(data)) return { ok: false, erro: "Escolha uma data válida.", campo: "data" };
  if (data < dataMinima()) return { ok: false, erro: "Para hoje, fale direto pelo WhatsApp. Pelo site, a partir de amanhã.", campo: "data" };
  if (data > dataMaxima()) return { ok: false, erro: "A agenda está aberta para os próximos 3 meses.", campo: "data" };

  const hora = texto(corpo.hora);
  const horarios = horariosDoDia(data);
  if (!horarios.length) return { ok: false, erro: "Não atendemos aos domingos. Escolha outra data.", campo: "data" };
  if (!horarios.includes(hora)) return { ok: false, erro: "Escolha um horário da lista.", campo: "hora" };

  const observacoes = texto(corpo.observacoes);
  if (observacoes.length > 500) return { ok: false, erro: "As observações podem ter até 500 caracteres.", campo: "observacoes" };

  if (corpo.consentimento !== true) {
    return { ok: false, erro: "Para enviar, é preciso aceitar o aviso de privacidade.", campo: "consentimento" };
  }

  return {
    ok: true,
    pedido: {
      nome, telefone, servicoId, data, hora,
      profissionalId: texto(corpo.profissional) || null,
      observacoes: observacoes || null,
    },
  };
}
