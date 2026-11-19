import nodemailer from "nodemailer";

// Roda no servidor (Node), nunca no navegador: as credenciais ficam protegidas.
export const runtime = "nodejs";

type Dados = {
  nome: string;
  telefone: string;
  email: string;
  servico: string;
  mensagem: string;
};

const LIMITES = { nome: 80, telefone: 30, email: 120, servico: 60, mensagem: 2000 };

function limpar(valor: unknown, max: number) {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

function montarTexto(d: Dados) {
  const campos = [
    `Nome: ${d.nome}`,
    `Telefone: ${d.telefone}`,
    d.email ? `E-mail: ${d.email}` : null,
    d.servico ? `Serviço: ${d.servico}` : null,
  ].filter(Boolean);
  return ["Nova mensagem pelo site do Luminé Beauty Club", "", ...campos, "", d.mensagem].join("\n");
}

async function enviarEmail(d: Dados, texto: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTATO_EMAIL_DESTINO } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !CONTATO_EMAIL_DESTINO) {
    throw new Error("E-mail não configurado (SMTP_USER, SMTP_PASS, CONTATO_EMAIL_DESTINO)");
  }
  const porta = Number(SMTP_PORT || 465);
  const transporte = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: porta,
    secure: porta === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporte.sendMail({
    from: `"Site Luminé" <${SMTP_USER}>`,
    to: CONTATO_EMAIL_DESTINO,
    replyTo: d.email || undefined,
    subject: `Contato pelo site: ${d.nome}`,
    text: texto,
  });
}

// WhatsApp via CallMeBot (gratuito): envia a mensagem para o número que ativou a API key.
async function enviarWhatsapp(texto: string) {
  const { CALLMEBOT_APIKEY, CONTATO_WHATSAPP_DESTINO } = process.env;
  if (!CALLMEBOT_APIKEY || !CONTATO_WHATSAPP_DESTINO) {
    throw new Error("WhatsApp não configurado (CALLMEBOT_APIKEY, CONTATO_WHATSAPP_DESTINO)");
  }
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", CONTATO_WHATSAPP_DESTINO);
  url.searchParams.set("text", texto);
  url.searchParams.set("apikey", CALLMEBOT_APIKEY);
  const resp = await fetch(url, { cache: "no-store" });
  const corpo = await resp.text();
  if (!resp.ok || /error|invalid|not active/i.test(corpo)) {
    throw new Error(`CallMeBot recusou o envio (HTTP ${resp.status})`);
  }
}

export async function POST(req: Request) {
  let bruto: Record<string, unknown>;
  try {
    bruto = await req.json();
  } catch {
    return Response.json({ ok: false, erro: "Requisição inválida." }, { status: 400 });
  }

  // Campo-armadilha: humanos não preenchem, robôs sim.
  if (limpar(bruto.site, 200)) return Response.json({ ok: true });

  const d: Dados = {
    nome: limpar(bruto.nome, LIMITES.nome),
    telefone: limpar(bruto.telefone, LIMITES.telefone),
    email: limpar(bruto.email, LIMITES.email),
    servico: limpar(bruto.servico, LIMITES.servico),
    mensagem: limpar(bruto.mensagem, LIMITES.mensagem),
  };

  if (!d.nome || !d.telefone || !d.mensagem) {
    return Response.json({ ok: false, erro: "Preencha nome, telefone e mensagem." }, { status: 400 });
  }
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    return Response.json({ ok: false, erro: "E-mail inválido." }, { status: 400 });
  }

  const texto = montarTexto(d);
  const [email, whatsapp] = await Promise.allSettled([enviarEmail(d, texto), enviarWhatsapp(texto)]);

  for (const [canal, r] of [["e-mail", email], ["whatsapp", whatsapp]] as const) {
    if (r.status === "rejected") console.error(`[contato] falha no envio por ${canal}:`, r.reason);
  }

  const enviados = { email: email.status === "fulfilled", whatsapp: whatsapp.status === "fulfilled" };
  if (!enviados.email && !enviados.whatsapp) {
    return Response.json(
      { ok: false, erro: "Não foi possível enviar agora. Tente pelo WhatsApp.", enviados },
      { status: 502 }
    );
  }
  return Response.json({ ok: true, enviados });
}
