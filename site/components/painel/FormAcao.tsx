"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoForm } from "@/app/painel/acoes-auth";

type Acao = (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
type Props = {
  acao: Acao;
  children: ReactNode;
  rotulo: string;
  className?: string;
  limparAoSalvar?: boolean;
  aoSalvar?: (mensagem: string) => void; // ex.: fechar o popup depois de cadastrar
};

/**
 * Formulário genérico do painel ligado a uma Server Action.
 * Mostra a mensagem de erro/sucesso que a ação devolver e desabilita o botão enquanto envia.
 */
export default function FormAcao({ acao, children, rotulo, className = "", limparAoSalvar = false, aoSalvar }: Props) {
  const [estado, executar] = useActionState(acao, {});
  const form = useRef<HTMLFormElement>(null);
  const aoSalvarRef = useRef(aoSalvar);
  aoSalvarRef.current = aoSalvar;

  useEffect(() => {
    if (!estado.ok) return;
    if (limparAoSalvar) form.current?.reset();
    aoSalvarRef.current?.(estado.ok);
  }, [estado, limparAoSalvar]);

  return (
    <form ref={form} action={executar} className={`p-form ${className}`}>
      {children}
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      {estado.ok && !aoSalvar && <p className="p-ok" role="status">{estado.ok}</p>}
      <BotaoEnviar rotulo={rotulo} />
    </form>
  );
}

export function BotaoEnviar({ rotulo, className = "botao" }: { rotulo: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? "Aguarde…" : rotulo}
    </button>
  );
}
