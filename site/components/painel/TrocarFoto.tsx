"use client";

import { useEffect, useRef, useState } from "react";
import { clienteNavegador, prepararFoto } from "@/lib/supabase-navegador";

type Props = {
  id: string; // id da profissional ou do serviço
  pasta: "perfis" | "servicos"; // pasta do Storage (o servidor confere)
  urlAtual: string | null;
  rotulo: string; // texto alternativo, ex.: "Foto de perfil de Gleicy"
  acao: (id: string, caminho: string) => Promise<{ erro?: string }>;
};

// Foto única com ícone de câmera no canto: toque no ícone -> "Trocar foto".
// A foto é reduzida no navegador, enviada ao Storage e o servidor grava o endereço.
export default function TrocarFoto({ id, pasta, urlAtual, rotulo, acao }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [menu, setMenu] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null); // mostra a nova foto antes do servidor responder
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // Fecha o menu ao tocar fora dele ou apertar Esc.
  useEffect(() => {
    if (!menu) return;
    const fora = (e: PointerEvent) => !caixa.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", fora); document.removeEventListener("keydown", esc); };
  }, [menu]);

  async function enviar(arquivo: File) {
    setErro(null);
    setEnviando(true);
    try {
      const { blob } = await prepararFoto(arquivo);
      setPrevia(URL.createObjectURL(blob));
      const caminho = `${pasta}/${id}/${crypto.randomUUID()}.webp`;
      const { error } = await clienteNavegador().storage.from("fotos")
        .upload(caminho, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error("Falha ao enviar a foto.");
      const r = await acao(id, caminho);
      if (r.erro) throw new Error(r.erro);
    } catch (e) {
      setErro((e as Error).message);
      setPrevia(null);
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  const src = previa ?? urlAtual;
  return (
    <div ref={caixa} className="p-foto-unica" aria-busy={enviando}>
      <div className="p-foto-unica-img">
        {src ? <img src={src} alt={rotulo} /> : <span aria-hidden="true">Sem foto</span>}
        {enviando && <span className="p-foto-enviando">Enviando…</span>}
      </div>
      <button type="button" className="p-camera" aria-label={`Opções da foto: ${rotulo}`} aria-expanded={menu}
        disabled={enviando} onClick={() => setMenu(!menu)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
        </svg>
      </button>
      {menu && (
        <div className="p-camera-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenu(false); entrada.current?.click(); }}>
            {src ? "Trocar foto" : "Adicionar foto"}
          </button>
        </div>
      )}
      <input ref={entrada} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
      {erro && <p className="erro" role="alert">{erro}</p>}
    </div>
  );
}
