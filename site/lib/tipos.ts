// Tipos do domínio usados pelo site e pelo painel (já no formato que vem do banco).

export type Foto = {
  id: string;
  url: string; // versão menor (cards e grade)
  urlGrande: string; // versão maior (foto ampliada)
  largura: number;
  altura: number;
  legenda: string;
};

export type Profissional = {
  id: string;
  nome: string;
  especialidade: string;
  sobre: string;
  tags: string[];
  instagram: string | null;
  whatsapp: string | null;
  retratoUrl: string | null;
  formacao: string[];
  fotos: Foto[];
};

export type Servico = {
  id: string;
  nome: string;
  descricao: string;
  fotoUrl: string | null; // null = ilustração padrão
  rotuloPreco: string | null; // substitui o "a partir de" calculado
  profissionais: string[]; // ids de quem atende
};

export type TipoPreco = "fixo" | "a_partir" | "faixa" | "consulta";

export type ItemPreco = {
  nome: string;
  tipo: TipoPreco;
  valor: number | null;
  valorMax: number | null;
  duracaoMin: number | null;
  obs: string | null;
  adicional: boolean;
  categoria: string | null;
};

export type TabelaPreco = {
  id: string;
  servicoId: string;
  titulo: string;
  profissionais: string[];
  itens: ItemPreco[];
};

export type FotoGaleria = Foto & { categoria: string }; // id da profissional ou "geral"

export type DadosSite = {
  profissionais: Profissional[];
  servicos: Servico[];
  tabelas: TabelaPreco[];
  fotosAbertura: Foto[];
  galeria: FotoGaleria[];
  origem: "banco" | "reserva"; // "reserva" = banco indisponível, usando content.ts
};

/** Intervalo indisponível de um dia (pedido confirmado ou bloqueio). */
export type Ocupacao = {
  profissionalId: string | null; // null = vale para todas
  inicio: string | null; // "HH:MM"; null = dia inteiro
  fim: string | null;
};
