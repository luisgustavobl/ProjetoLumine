import { dataValida, horasOcupadas } from "@/lib/agenda";
import { buscarOcupacoes, candidatasDoServico } from "@/lib/ocupacoes";

export const dynamic = "force-dynamic";

/**
 * GET /api/horarios?data=2026-12-01&servico=makes&profissional=gleicy
 * Responde quais horários do dia estão ocupados para esse serviço/profissional.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const data = params.get("data") ?? "";
  const servico = params.get("servico") ?? "";
  const profissional = params.get("profissional") || null;

  if (!dataValida(data)) return Response.json({ erro: "Data inválida." }, { status: 400 });

  try {
    const candidatas = servico ? await candidatasDoServico(servico, profissional) : [];
    if (candidatas === null) return Response.json({ erro: "Serviço ou profissional inválido." }, { status: 400 });
    const ocupados = horasOcupadas(data, candidatas, await buscarOcupacoes(data));
    return Response.json({ ocupados }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    console.error("[api/horarios]", (erro as Error).message);
    // Sem a agenda, o formulário continua funcionando: a profissional confirma depois.
    return Response.json({ ocupados: [], aviso: "Agenda indisponível no momento." }, { status: 503 });
  }
}
