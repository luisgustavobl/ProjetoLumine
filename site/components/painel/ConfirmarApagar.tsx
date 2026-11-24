"use client";

import { useEffect, useState } from "react";

const SEGUNDOS = 5;

type Props = { titulo: string; nota?: string; aoConfirmar: () => void; aoCancelar: () => void };

// Confirmação de apagar com espera de 5 s: "Apagar" inicia a contagem,
// tocar de novo apaga na hora e "Cancelar" desiste.
export default function ConfirmarApagar({ titulo, nota, aoConfirmar, aoCancelar }: Props) {
  const [contagem, setContagem] = useState<number | null>(null);

  useEffect(() => {
    if (contagem === null) return;
    if (contagem === 0) { aoConfirmar(); return; }
    const t = setTimeout(() => setContagem((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contagem]);

  return (
    <div className="p-form p-confirmar">
      <h3>{titulo}</h3>
      {nota && <p className="nota">{nota}</p>}
      <div className="p-acoes">
        <button type="button" className="botao botao--linha" onClick={aoCancelar}>Cancelar</button>
        <button type="button" className="botao botao--perigo p-apagar"
          onClick={() => setContagem((c) => (c === null ? SEGUNDOS : 0))}>
          {contagem === null ? "Apagar" : `Apagar agora (${contagem})`}
        </button>
      </div>
    </div>
  );
}
