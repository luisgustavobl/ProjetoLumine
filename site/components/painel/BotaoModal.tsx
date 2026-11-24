"use client";

import { useState, type ReactNode } from "react";
import type { EstadoForm } from "@/app/painel/acoes-auth";
import Modal from "@/components/Modal";
import FormAcao from "./FormAcao";

type Props = {
  rotuloBotao: string; // ex.: "+ Cadastrar profissional"
  titulo: string;
  descricao?: ReactNode;
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  rotuloEnviar: string;
  children: ReactNode; // campos do formulário
};

// Botão que abre um formulário em janela (popup). Ao salvar, fecha e mostra a confirmação ao lado do botão.
export default function BotaoModal({ rotuloBotao, titulo, descricao, acao, rotuloEnviar, children }: Props) {
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);
  const [versao, setVersao] = useState(0); // muda a cada abertura: o formulário recomeça vazio

  const abrir = () => { setConfirmacao(null); setVersao((v) => v + 1); setAberto(true); };

  return (
    <div className="p-novo">
      <button type="button" className="botao" onClick={abrir}>{rotuloBotao}</button>
      {confirmacao && <p className="p-ok" role="status">{confirmacao}</p>}
      <Modal aberto={aberto} aoFechar={() => setAberto(false)} rotulo={titulo} className="p-modal">
        <div className="form-box">
          <button type="button" className="x" aria-label="Fechar" onClick={() => setAberto(false)}>×</button>
          <h3>{titulo}</h3>
          {descricao && <p className="nota">{descricao}</p>}
          <FormAcao key={versao} acao={acao} rotulo={rotuloEnviar}
            aoSalvar={(msg) => { setAberto(false); setConfirmacao(msg); }}>
            {children}
          </FormAcao>
        </div>
      </Modal>
    </div>
  );
}
