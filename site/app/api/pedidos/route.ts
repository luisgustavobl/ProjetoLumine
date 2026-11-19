import { contato } from "@/content";
import { horarioOcupado } from "@/lib/agenda";
import { buscarOcupacoes, candidatasDoServico } from "@/lib/ocupacoes";
import { clienteAdmin } from "@/lib/supabase";
import { validarPedido } from "@/lib/validacao";

export const dynamic = "force-dynamic";

// ---------- Anti-spam ----------
const TEMPO_MINIMO_MS = 3000; // um humano leva mais que isso para preencher o formulário
const LIMITE_POR_IP = 5; // pedidos por IP…
const JANELA_IP_MS = 10 * 60 * 1000; // …a cada 10 minutos
const LIMITE_POR_TELEFONE = 3; // pedidos pendentes do mesmo número nas últimas 24h

// Contador simples em memória. Em hospedagem serverless cada instância tem o seu,
// então é uma barreira extra; a verificação por telefone (no banco) é a principal.
const acessosPorIp = new Map<string, number[]>();

function excedeuLimiteDoIp(ip: string): boolean {
  const agora = Date.now();
  const recentes = (acessosPorIp.get(ip) ?? []).filter((t) => agora - t < JANELA_IP_MS);
  recentes.push(agora);
  acessosPorIp.set(ip, recentes);
  return recentes.length > LIMITE_POR_IP;
}

// ---------- Código do pedido ----------
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L para não confundir
function gerarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return "LUM-" + Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

const falha = (erro: string, status: number, campo?: string) => Response.json({ ok: false, erro, campo }, { status });

/**
 * POST /api/pedidos — grava um pedido de agendamento (status "pendente").
 * Responde com o código do pedido e o WhatsApp para a cliente continuar a conversa.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return falha("Requisição inválida.", 400);
  }

  // Robôs preenchem o campo escondido ou enviam rápido demais: fingimos sucesso e descartamos.
  const preenchidoEm = Number(corpo.iniciadoEm);
  if (corpo.site || !preenchidoEm || Date.now() - preenchidoEm < TEMPO_MINIMO_MS) {
    return Response.json({ ok: true, codigo: "LUM-OK", whatsapp: contato.whatsapp });
  }

  const validacao = validarPedido(corpo);
  if (!validacao.ok) return falha(validacao.erro, 400, validacao.campo);
  const pedido = validacao.pedido;

  // Só conta pedidos válidos: quem erra um campo e corrige não é bloqueada.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (excedeuLimiteDoIp(ip)) return falha("Muitos pedidos seguidos. Aguarde alguns minutos.", 429);

  try {
    const candidatas = await candidatasDoServico(pedido.servicoId, pedido.profissionalId);
    if (candidatas === null) return falha("Serviço ou profissional inválido.", 400, "servico");

    if (horarioOcupado(pedido.hora, candidatas, await buscarOcupacoes(pedido.data))) {
      return falha("Esse horário acabou de ser ocupado. Escolha outro.", 409, "hora");
    }

    const db = clienteAdmin();
    const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: erroContagem } = await db
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("telefone", pedido.telefone)
      .eq("status", "pendente")
      .gte("criado_em", umDiaAtras);
    if (erroContagem) throw new Error(erroContagem.message);
    if ((count ?? 0) >= LIMITE_POR_TELEFONE) {
      return falha("Você já tem pedidos aguardando resposta. Fale com a equipe pelo WhatsApp.", 429);
    }

    // Tenta alguns códigos caso (raro) o sorteado já exista.
    let codigo = "";
    for (let tentativa = 0; tentativa < 3 && !codigo; tentativa++) {
      const candidato = gerarCodigo();
      const { error } = await db.from("pedidos").insert({
        codigo: candidato,
        nome: pedido.nome,
        telefone: pedido.telefone,
        servico_id: pedido.servicoId,
        profissional_id: pedido.profissionalId,
        data: pedido.data,
        hora: pedido.hora,
        observacoes: pedido.observacoes,
        consentimento_em: new Date().toISOString(),
      });
      if (!error) codigo = candidato;
      else if (error.code !== "23505") throw new Error(error.message); // 23505 = código repetido
    }
    if (!codigo) throw new Error("Não foi possível gerar um código único.");

    // WhatsApp de destino: a profissional escolhida (ou a única do serviço); senão, o do espaço.
    const destinoId = pedido.profissionalId ?? (candidatas.length === 1 ? candidatas[0] : null);
    let whatsapp = contato.whatsapp;
    if (destinoId) {
      const { data: prof } = await db.from("profissionais").select("whatsapp").eq("id", destinoId).single();
      if (prof?.whatsapp) whatsapp = prof.whatsapp;
    }

    return Response.json({ ok: true, codigo, whatsapp }, { status: 201 });
  } catch (erro) {
    // Não registra dados pessoais no log, só a causa técnica.
    console.error("[api/pedidos]", (erro as Error).message);
    return falha("Não conseguimos registrar seu pedido agora. Tente de novo ou chame no WhatsApp.", 503);
  }
}
