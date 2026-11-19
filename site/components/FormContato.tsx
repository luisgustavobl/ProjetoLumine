"use client";

import { useState, type FormEvent } from "react";

type Estado =
  | { tipo: "ocioso" }
  | { tipo: "enviando" }
  | { tipo: "sucesso" }
  | { tipo: "erro"; texto: string };

export default function FormContato({ servicos }: { servicos: string[] }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = Object.fromEntries(new FormData(form));
    setEstado({ tipo: "enviando" });
    try {
      const resp = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) throw new Error(json.erro || "Não foi possível enviar.");
      form.reset();
      setEstado({ tipo: "sucesso" });
    } catch (err) {
      setEstado({ tipo: "erro", texto: err instanceof Error ? err.message : "Não foi possível enviar." });
    }
  }

  const enviando = estado.tipo === "enviando";

  return (
    <form className="form-contato" onSubmit={enviar} noValidate={false}>
      <div className="form-linha">
        <label>
          Nome
          <input name="nome" type="text" required maxLength={80} autoComplete="name" />
        </label>
        <label>
          WhatsApp / Telefone
          <input name="telefone" type="tel" required maxLength={30} autoComplete="tel" placeholder="(85) 9 0000-0000" />
        </label>
      </div>
      <div className="form-linha">
        <label>
          E-mail <span className="opcional">(opcional)</span>
          <input name="email" type="email" maxLength={120} autoComplete="email" />
        </label>
        <label>
          Serviço
          <select name="servico" defaultValue="">
            <option value="">Selecione…</option>
            {servicos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Mensagem
        <textarea name="mensagem" required rows={5} maxLength={2000} placeholder="Conte o que você precisa e a data desejada." />
      </label>

      {/* armadilha anti-spam: invisível para pessoas */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="form-armadilha" aria-hidden="true" />

      <button className="botao" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar mensagem"}
      </button>

      <p className="form-status" role="status" aria-live="polite">
        {estado.tipo === "sucesso" && "Mensagem enviada! Retornaremos em breve."}
        {estado.tipo === "erro" && <span className="form-erro">{estado.texto}</span>}
      </p>
    </form>
  );
}
