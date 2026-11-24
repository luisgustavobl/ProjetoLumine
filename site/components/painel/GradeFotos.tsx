"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  apagarFoto, atualizarFoto, registrarFotos, reordenarFotos, type FotoEnviada,
} from "@/app/painel/(logado)/acoes-fotos";
import Modal from "@/components/Modal";
import ConfirmarApagar from "./ConfirmarApagar";
import { clienteNavegador, prepararFoto } from "@/lib/supabase-navegador";

export type FotoPainel = {
  id: string; url: string; urlGrande: string; legenda: string; naGaleria: boolean; naAbertura: boolean;
};
type Props = { dono: string | null; nomeDono: string; fotos: FotoPainel[]; retratoUrl: string | null };

/** Uma miniatura arrastável. Toque curto abre a edição; segurar e arrastar muda a posição. */
function Miniatura({ foto, posicao, ehRetrato, aoAbrir }: { foto: FotoPainel; posicao: number; ehRetrato: boolean; aoAbrir: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: foto.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`ig-foto${isDragging ? " arrastando" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={aoAbrir}
      aria-label={`Foto ${posicao}: ${foto.legenda || "sem legenda"}${foto.naAbertura ? ", na abertura" : ""}${foto.naGaleria ? "" : ", fora da galeria"}. Toque para editar, segure e arraste para mudar a posição.`}
      {...attributes}
      {...listeners}
    >
      <img src={foto.url} alt="" loading="lazy" draggable={false} />
      <span className="ig-num" aria-hidden="true">{posicao}</span>
      {ehRetrato && <span className="ig-selo">Perfil</span>}
      {/* Ícones no canto: na abertura do site / fora da galeria. */}
      {(foto.naAbertura || !foto.naGaleria) && (
        <span className="ig-icones">
          {foto.naAbertura && (
            <span className="ig-icone" title="Na abertura do site">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z" /><path d="M9 20v-6h6v6" /></svg>
            </span>
          )}
          {!foto.naGaleria && (
            <span className="ig-icone" title="Fora da galeria">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3 3.6M6.5 7.6C4.3 9.2 3 12 3 12s4 6 9 6a9 9 0 0 0 3.5-.7" /></svg>
            </span>
          )}
        </span>
      )}
    </button>
  );
}

// Grade de fotos no estilo Instagram: segure e arraste para reordenar, toque para editar, "+" para enviar.
export default function GradeFotos({ dono, nomeDono, fotos, retratoUrl }: Props) {
  const [ordem, setOrdem] = useState(fotos); // cópia local: a grade muda na hora, antes do banco responder
  const [selecionada, setSelecionada] = useState<FotoPainel | null>(null);
  const [legenda, setLegenda] = useState("");
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false); // popup mostrando a confirmação de apagar
  const [ocupado, iniciar] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => setOrdem(fotos), [fotos]); // o servidor mandou a lista atualizada

  // Mouse: arrasta após mover 6 px. Toque: segura 250 ms (assim a rolagem da página continua normal).
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function aoSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const de = ordem.findIndex((f) => f.id === active.id);
    const para = ordem.findIndex((f) => f.id === over.id);
    const nova = arrayMove(ordem, de, para);
    setOrdem(nova);
    iniciar(async () => {
      const r = await reordenarFotos(nova.map((f) => f.id));
      if (r.erro) {
        setErro("Não foi possível salvar a nova ordem.");
        setOrdem(fotos); // volta ao que estava salvo
      }
    });
  }

  const abrir = (f: FotoPainel) => {
    setSelecionada(f);
    setLegenda(f.legenda);
    setErro(null);
  };

  /** Reduz cada foto no navegador, envia ao Storage e registra no banco. */
  async function enviar(arquivos: FileList) {
    setErro(null);
    const db = clienteNavegador();
    const enviadas: FotoEnviada[] = [];
    try {
      for (const [i, arquivo] of Array.from(arquivos).entries()) {
        setProgresso(`Enviando ${i + 1} de ${arquivos.length}…`);
        const { blob, largura, altura } = await prepararFoto(arquivo);
        const caminho = `${dono ?? "espaco"}/${crypto.randomUUID()}.webp`;
        const { error } = await db.storage.from("fotos").upload(caminho, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error(`Falha ao enviar "${arquivo.name}": ${error.message}`);
        enviadas.push({ caminho, largura, altura });
      }
    } catch (e) {
      setErro((e as Error).message);
    }
    if (enviadas.length) {
      const r = await registrarFotos(dono, enviadas);
      if (r.erro) setErro(r.erro);
    }
    setProgresso(null);
    if (entrada.current) entrada.current.value = "";
  }

  const acao = (fn: () => Promise<{ erro?: string }>, fecharDepois = false) =>
    iniciar(async () => {
      const r = await fn();
      if (r.erro) setErro(r.erro);
      else if (fecharDepois) setSelecionada(null);
    });

  const indice = selecionada ? ordem.findIndex((f) => f.id === selecionada.id) : -1;

  return (
    <>
      <div className="ig-cab">
        <p className="ig-dica">
          <strong>{ordem.length} {ordem.length === 1 ? "foto" : "fotos"}</strong> · toque para editar · segure e arraste para mudar a ordem
        </p>
        <label className={`botao${progresso ? " desativado" : ""}`}>
          {progresso ?? "+ Adicionar fotos"}
          <input ref={entrada} type="file" accept="image/*" multiple hidden disabled={!!progresso}
            onChange={(e) => e.target.files?.length && enviar(e.target.files)} />
        </label>
      </div>
      {erro && !selecionada && <p className="erro" role="alert">{erro}</p>}

      {ordem.length === 0 ? (
        <p className="p-vazio-grande">Nenhuma foto ainda. Toque em “+ Adicionar fotos”.</p>
      ) : (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
          <SortableContext items={ordem.map((f) => f.id)} strategy={rectSortingStrategy}>
            <div className="ig-grade">
              {ordem.map((f, i) => (
                <Miniatura key={f.id} foto={f} posicao={i + 1} ehRetrato={f.urlGrande === retratoUrl} aoAbrir={() => abrir(f)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal aberto={selecionada !== null} aoFechar={() => { setSelecionada(null); setConfirmando(false); }} rotulo="Editar foto">
        {selecionada && confirmando && (
          <div className="form-box">
            <ConfirmarApagar titulo="Apagar esta foto do site?" aoCancelar={() => setConfirmando(false)}
              aoConfirmar={() => { setConfirmando(false); acao(() => apagarFoto(selecionada.id), true); }} />
          </div>
        )}
        {selecionada && !confirmando && (
          <div className="form-box ig-detalhe" aria-busy={ocupado}>
            <button className="x" type="button" onClick={() => setSelecionada(null)} aria-label="Fechar">×</button>
            <p className="sobre">{nomeDono} · foto {indice + 1} de {ordem.length}</p>
            <img src={selecionada.urlGrande} alt={selecionada.legenda} />
            <div className="campo">
              <label htmlFor="ig-legenda">Legenda</label>
              <input id="ig-legenda" value={legenda} maxLength={120} placeholder="Ex.: Make de noiva"
                onChange={(e) => setLegenda(e.target.value)}
                onBlur={() => legenda !== selecionada.legenda && acao(() => atualizarFoto(selecionada.id, { legenda }))} />
            </div>
            <label className="p-check">
              <input type="checkbox" defaultChecked={selecionada.naGaleria}
                onChange={(e) => acao(() => atualizarFoto(selecionada.id, { na_galeria: e.target.checked }))} />
              Mostrar na galeria do site
            </label>
            <label className="p-check">
              <input type="checkbox" defaultChecked={selecionada.naAbertura}
                onChange={(e) => acao(() => atualizarFoto(selecionada.id, { na_abertura: e.target.checked }))} />
              Usar na abertura do site
            </label>
            <button className="botao botao--perigo" type="button" disabled={ocupado} onClick={() => setConfirmando(true)}>Apagar</button>
            {erro && <p className="erro" role="alert">{erro}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
