import { redirect } from "next/navigation";
import { AGENDAMENTO_ONLINE } from "@/lib/recursos";

// Página inicial do painel: a Agenda, se o agendamento online estiver ligado; senão, as Fotos.
export default function InicioPainel() {
  redirect(AGENDAMENTO_ONLINE ? "/painel/agenda" : "/painel/fotos");
}
