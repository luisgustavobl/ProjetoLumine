// Conteúdo do site. Na fase do backend, profissionais, preços e fotos passam a vir
// do banco de dados (editáveis no painel); estes valores servem de carga inicial.

/** Identificador de uma foto em public/img (existem as versões -480 e -960 .webp). */
export type FotoId = keyof typeof DIMENSOES;
export type Foto = { id: FotoId; legenda: string };

export type TipoPreco = "fixo" | "a_partir" | "faixa" | "consulta";
export type ItemPreco = {
  nome: string;
  tipo: TipoPreco;
  valor?: number; // "fixo" e "a_partir": valor; "faixa": mínimo
  valorMax?: number; // só "faixa"
  duracaoMin?: number;
  obs?: string;
  adicional?: boolean; // complemento (ex.: conserto por unha): não entra no "a partir de" do card
  categoria?: string; // agrupa itens dentro da tabela (ex.: "Alongamento", "Cílios")
};
/** Uma tabela por área de serviço; Cursos têm uma tabela por profissional. */
export type TabelaPreco = {
  id: string;
  servicoId: ServicoId;
  titulo: string;
  profissionais: ProfissionalId[];
  itens: ItemPreco[];
};

export type ServicoId = "makes" | "penteados" | "nails" | "tattoo" | "cursos";
export type ProfissionalId = "gleicy" | "evelyne" | "kamila" | "ganesha";

export type Servico = {
  id: ServicoId;
  nome: string;
  descricao: string;
  foto: FotoId | null; // null = ilustração (Cursos)
  rotuloPreco?: string; // substitui o "a partir de" calculado (ex.: tattoo)
};

export type Profissional = {
  id: ProfissionalId;
  nome: string;
  especialidade: string;
  sobre: string;
  tags: string[];
  retrato: FotoId;
  instagram: string; // @ sem a arroba
  fotos: Foto[];
  temFormacao?: boolean;
};

// Largura × altura originais, para o navegador reservar o espaço antes de carregar.
export const DIMENSOES = {
  "evelyne-retrato-00": [441, 691], "evelyne-trabalho-01": [579, 760], "evelyne-trabalho-02": [439, 531],
  "evelyne-trabalho-03": [586, 699], "evelyne-trabalho-04": [619, 667], "ganesha-retrato-05": [798, 820],
  "ganesha-trabalho-06": [697, 736], "ganesha-trabalho-07": [609, 652], "ganesha-trabalho-08": [960, 1280],
  "ganesha-trabalho-09": [960, 1280], "geral-foto-10": [579, 769], "geral-foto-11": [595, 769],
  "geral-foto-12": [597, 729], "geral-foto-13": [769, 751], "gleicy-retrato-14": [549, 401],
  "gleicy-trabalho-15": [430, 570], "gleicy-trabalho-16": [304, 382], "gleicy-trabalho-17": [307, 394],
  "gleicy-trabalho-18": [580, 645], "gleicy-trabalho-19": [303, 378], "gleicy-trabalho-20": [613, 766],
  "gleicy-trabalho-21": [778, 739], "kamila-retrato-22": [487, 748], "kamila-trabalho-23": [577, 772],
  "kamila-trabalho-24": [774, 769], "kamila-trabalho-25": [559, 640], "servico-makes-26": [279, 304],
  "servico-penteado-27": [769, 769],
} as const satisfies Record<string, readonly [number, number]>;

export const contato = {
  endereco: "Av. Monsenhor Tabosa, 351 – Praia de Iracema",
  cidade: "Fortaleza – CE, 60165-011",
  horario: "Segunda a sábado, das 9h às 19h · com hora marcada",
  instagram: "luminebeautyclub",
  // Número de teste. Depois, cada profissional cadastra o próprio no painel.
  whatsapp: "5585998369623",
  // Links oficiais de WhatsApp do espaço, por área de atendimento.
  whatsappAreas: [
    { area: "Maquiagem e penteados", link: "https://wa.me/message/6YYLR7DW65UTP1" },
    { area: "Nails e estética", link: "https://wa.me/message/KVBX3ZKX5OB4P1" },
  ],
  googleMaps: "https://maps.app.goo.gl/LxY5oVDn4nYRpAAv7",
  notaGoogle: "5,0",
  avaliacoesGoogle: 16,
};

/** Funcionamento: domingo fechado; horários de hora em hora das 9h às 18h (último início). */
export const funcionamento = {
  diasFechados: [0], // 0 = domingo
  primeiraHora: 9,
  ultimaHora: 18,
};

export const servicos: Servico[] = [
  { id: "makes", nome: "Makes", descricao: "Social, noivas, debutantes e eventos.", foto: "servico-makes-26" },
  { id: "penteados", nome: "Penteados", descricao: "Tranças, coques e ondas para o seu dia.", foto: "servico-penteado-27" },
  { id: "nails", nome: "Nails & estética", descricao: "Manicure, alongamento, nail art, cílios e estética.", foto: "kamila-trabalho-23" },
  { id: "tattoo", nome: "Tattoo", descricao: "Fine line, aquarela e projetos autorais.", foto: "ganesha-trabalho-08", rotuloPreco: "orçamento pelo projeto" },
  { id: "cursos", nome: "Cursos", descricao: "Automaquiagem, make profissional, penteados e mais.", foto: null, rotuloPreco: "turmas mensais" },
];

export const profissionais: Profissional[] = [
  {
    id: "gleicy", nome: "Gleicy Lima", especialidade: "Make & Penteado", retrato: "gleicy-retrato-14", instagram: "gleicylimabeauty", temFormacao: true,
    sobre: "Fundadora do Luminé e especialista em realçar beleza desde 2013. Atende noivas, debutantes e eventos e forma novas profissionais em seus cursos.",
    tags: ["Noivas & debutantes", "Cursos", "Penteados"],
    fotos: [
      { id: "gleicy-trabalho-21", legenda: "Noiva" }, { id: "gleicy-trabalho-16", legenda: "Make glow" },
      { id: "gleicy-trabalho-20", legenda: "Make natural com ondas" }, { id: "gleicy-trabalho-18", legenda: "Make com cílios rosados" },
      { id: "gleicy-trabalho-17", legenda: "Debutante" }, { id: "gleicy-trabalho-15", legenda: "Make social" },
      { id: "gleicy-trabalho-19", legenda: "Make e cabelo cacheado" },
    ],
  },
  {
    id: "evelyne", nome: "Evelyne Almeida", especialidade: "Nails & estética", retrato: "evelyne-retrato-00", instagram: "evelyne.almeida_",
    sobre: "Nail art com personalidade: cores vivas, desenhos à mão e acabamentos que chamam atenção.",
    tags: ["Nail art", "Desenho à mão", "Gel"],
    fotos: [
      { id: "evelyne-trabalho-01", legenda: "Nail art Noite Estrelada" }, { id: "evelyne-trabalho-03", legenda: "Degradê neon" },
      { id: "evelyne-trabalho-02", legenda: "Dourado e animal print" }, { id: "evelyne-trabalho-04", legenda: "Unhas prateadas com flores" },
    ],
  },
  {
    id: "kamila", nome: "Kamila", especialidade: "Manicure", retrato: "kamila-retrato-22", instagram: "kamilasilvestree",
    sobre: "Esmaltação impecável para o dia a dia e para ocasiões especiais, do clássico ao cromado.",
    tags: ["Cromado", "Esmaltação em gel", "Decoradas"],
    fotos: [
      { id: "kamila-trabalho-23", legenda: "Cromado verde" }, { id: "kamila-trabalho-24", legenda: "Lilás perolado" },
      { id: "kamila-trabalho-25", legenda: "Decoradas com dourado" },
    ],
  },
  {
    id: "ganesha", nome: "Ganesha", especialidade: "Tattoo", retrato: "ganesha-retrato-05", instagram: "ganesha_tattoo_arte",
    sobre: "Do traço fino à aquarela colorida, tatuagens criadas a partir da sua ideia.",
    tags: ["Fine line", "Aquarela", "Geek & anime"],
    fotos: [
      { id: "ganesha-trabalho-07", legenda: "Coração em aquarela" }, { id: "ganesha-trabalho-09", legenda: "Ramo floral fine line" },
      { id: "ganesha-trabalho-06", legenda: "Tattoo anime" }, { id: "ganesha-trabalho-08", legenda: "Tatuando" },
    ],
  },
];

/** Quem atende cada serviço (define o filtro de profissional no agendamento). */
export const atendePor: Record<ServicoId, ProfissionalId[]> = {
  makes: ["gleicy"],
  penteados: ["gleicy"],
  nails: ["evelyne", "kamila"],
  tattoo: ["ganesha"],
  cursos: ["gleicy"],
};

// Valores das agendas online das profissionais (online.maapp.com.br, nov/2026).
// O que não tem preço publicado fica "sob consulta" até a equipe definir no painel.
export const tabelasPreco: TabelaPreco[] = [
  // Agenda online da Gleicy (online.maapp.com.br/GleicyLimaBeauty).
  {
    id: "makes", servicoId: "makes", titulo: "Maquiagem", profissionais: ["gleicy"],
    itens: [
      { nome: "Maquiagem estúdio", tipo: "fixo", valor: 220, duracaoMin: 45 },
      { nome: "Make infantil", tipo: "fixo", valor: 120, duracaoMin: 30 },
      { nome: "Combo 02 estúdio", tipo: "fixo", valor: 350, duracaoMin: 120 },
      { nome: "Noivas e debutantes", tipo: "consulta", obs: "Pacote combinado com a Gleicy" },
      { nome: "Atendimento a domicílio", tipo: "consulta", obs: "Taxa conforme o local" },
    ],
  },
  {
    id: "penteados", servicoId: "penteados", titulo: "Penteados", profissionais: ["gleicy"],
    itens: [
      { nome: "Penteado estúdio", tipo: "fixo", valor: 170, duracaoMin: 45 },
      { nome: "Combo 02 estúdio", tipo: "fixo", valor: 350, duracaoMin: 120 },
      { nome: "Noivas e debutantes", tipo: "consulta", obs: "Pacote combinado com a Gleicy" },
    ],
  },
  // Serviços e valores da agenda online da Evelyne (online.maapp.com.br/EvelyneAlmeida, nov/2026).
  {
    id: "nails", servicoId: "nails", titulo: "Nails e estética", profissionais: ["evelyne", "kamila"],
    itens: [
      { categoria: "Manicure", nome: "Manicure tradicional", tipo: "fixo", valor: 40, duracaoMin: 45 },
      { categoria: "Manicure", nome: "Esmaltação em gel", tipo: "fixo", valor: 35, duracaoMin: 40, obs: "Só a pintura, sem cutilagem" },
      { categoria: "Manicure", nome: "Manicure russa", tipo: "fixo", valor: 60, duracaoMin: 60, obs: "Com esmaltação em gel" },
      { categoria: "Manicure", nome: "Blindagem", tipo: "fixo", valor: 90, duracaoMin: 60 },
      { categoria: "Manicure", nome: "Banho", tipo: "fixo", valor: 130, duracaoMin: 60, obs: "Reforço da unha natural" },
      { categoria: "Manicure", nome: "Pé e mão (combo)", tipo: "fixo", valor: 60, duracaoMin: 90 },
      { categoria: "Manicure", nome: "Pedicure tradicional", tipo: "fixo", valor: 40, duracaoMin: 60 },
      { categoria: "Manicure", nome: "Podal russo", tipo: "fixo", valor: 60, duracaoMin: 60 },
      { categoria: "Manicure", nome: "Terapia podal", tipo: "fixo", valor: 110, duracaoMin: 60, obs: "Escalda-pés, massagem e esmaltação em gel" },
      { categoria: "Manicure", nome: "Peeling de pés", tipo: "fixo", valor: 100, duracaoMin: 90 },
      { categoria: "Manicure", nome: "SPA (calosidade)", tipo: "fixo", valor: 100, duracaoMin: 60 },
      { categoria: "Manicure", nome: "Podologia (onicocriptose)", tipo: "fixo", valor: 100, duracaoMin: 60 },
      { categoria: "Manicure", nome: "Remoção de alongamentos", tipo: "fixo", valor: 50, duracaoMin: 60 },
      { categoria: "Alongamento", nome: "Molde de papel", tipo: "fixo", valor: 180, duracaoMin: 60, obs: "Acrílico, gel ou polygel" },
      { categoria: "Alongamento", nome: "Molde russo", tipo: "fixo", valor: 160, duracaoMin: 60 },
      { categoria: "Alongamento", nome: "Soft gel", tipo: "fixo", valor: 100, duracaoMin: 60 },
      { categoria: "Alongamento", nome: "Formatos criativos", tipo: "fixo", valor: 280, duracaoMin: 120 },
      { categoria: "Alongamento", nome: "Formatos extremos", tipo: "fixo", valor: 500, duracaoMin: 180, obs: "Acima de 5 cm" },
      { categoria: "Alongamento", nome: "Manutenção simples", tipo: "fixo", valor: 130, duracaoMin: 60 },
      { categoria: "Alongamento", nome: "Manutenção com troca de formato", tipo: "fixo", valor: 150, duracaoMin: 90 },
      { categoria: "Alongamento", nome: "Manutenção com decoração", tipo: "fixo", valor: 170, duracaoMin: 90 },
      { categoria: "Alongamento", nome: "Conserto de unha", tipo: "fixo", valor: 20, duracaoMin: 30, obs: "Por unha", adicional: true },
      { categoria: "Nail art", nome: "Filha única", tipo: "fixo", valor: 30, duracaoMin: 30, obs: "Decoração em par", adicional: true },
      { categoria: "Nail art", nome: "Nail design", tipo: "fixo", valor: 50, duracaoMin: 60, adicional: true },
      { categoria: "Nail art", nome: "Nail style", tipo: "fixo", valor: 100, duracaoMin: 90, obs: "Requer avaliação", adicional: true },
      { categoria: "Cílios", nome: "Alongamento brasileiro", tipo: "fixo", valor: 150, duracaoMin: 90 },
      { categoria: "Cílios", nome: "Alongamento fio egípcio", tipo: "fixo", valor: 170, duracaoMin: 90 },
      { categoria: "Cílios", nome: "Cílios sirena", tipo: "fixo", valor: 120, duracaoMin: 60 },
      { categoria: "Cílios", nome: "Manutenção (15 a 21 dias)", tipo: "fixo", valor: 100, duracaoMin: 90 },
      { categoria: "Cílios", nome: "Remoção de cílios", tipo: "fixo", valor: 50, duracaoMin: 55 },
      { categoria: "Estética", nome: "Hidrolip", tipo: "fixo", valor: 150, duracaoMin: 90 },
      { categoria: "Estética", nome: "Microblading", tipo: "fixo", valor: 250, duracaoMin: 90 },
      { categoria: "Estética", nome: "Micropigmentação de sobrancelha", tipo: "fixo", valor: 500, duracaoMin: 90 },
      { categoria: "Estética", nome: "Micropigmentação labial", tipo: "fixo", valor: 500, duracaoMin: 180, obs: "Inclui retorno em 30 dias" },
      { categoria: "Estética", nome: "Retoque de micropigmentação", tipo: "fixo", valor: 400, duracaoMin: 90 },
    ],
  },
  {
    id: "tattoo", servicoId: "tattoo", titulo: "Tattoo", profissionais: ["ganesha"],
    itens: [
      { nome: "Fine line", tipo: "consulta", obs: "Orçamento pelo tamanho e local" },
      { nome: "Aquarela", tipo: "consulta", obs: "Orçamento pelo tamanho e local" },
      { nome: "Projeto autoral", tipo: "consulta", obs: "Criado a partir da sua ideia" },
    ],
  },
  {
    id: "cursos-gleicy", servicoId: "cursos", titulo: "Cursos com Gleicy Lima", profissionais: ["gleicy"],
    itens: [
      { nome: "Automaquiagem", tipo: "consulta", obs: "Individual ou em turma" },
      { nome: "Maquiagem profissional", tipo: "consulta", obs: "Turmas mensais" },
      { nome: "Penteados", tipo: "consulta", obs: "Turmas mensais" },
    ],
  },
];

export const fotosGerais: Foto[] = [
  { id: "geral-foto-10", legenda: "Make Luminé" },
  { id: "geral-foto-12", legenda: "Recepção do Luminé" },
  { id: "geral-foto-13", legenda: "Retoque de batom" },
  { id: "geral-foto-11", legenda: "Unhas vinho" },
];

export const formacaoGleicy = [
  "Técnica PRO EXPERT Kohll Beauty", "Colorimetria por Priscila Lima", "Pele Perfeita por Priscila Lima",
  "Dermacolor por Priscila Lima", "Cinthia Zanuni", "Érica Dextro Penteados", "Marina Bet", "Luana Charamba",
  "Raphael Lessa", "Tati Bueno", "Anairana", "Advanced Lamination Gabriela Garcia Academy", "Lays Brunelle",
  "Guilherme Nogueira", "Fernanda Inyn", "Alice Gontijo", "Joyce Barbosa", "Ederson Oliveira", "Estética Bioage",
  "Fios Miméticos por Cássia Melo", "Fotografia por Nat Teodoro", "Joss Brand", "Karla Alexandrina",
  "Mere Vilas Boas", "Mara Ribeiro Penteados", "Colorimetria por Nat Teodoro",
];

// Avaliações reais do Google Maps (out/2026).
export const depoimentos = [
  { texto: "Atendimento excelente e profissionais de altíssima qualidade. Amei minhas unhas.", nome: "Ana Lua", fonte: "Avaliação no Google · Unhas" },
  { texto: "Atendimento maravilhoso, tudo perfeito ❤️❤️", nome: "Júlia Santiago", fonte: "Avaliação no Google" },
  { texto: "Ótimo trabalho! Qualidade 100%", nome: "Carlos Holanda", fonte: "Avaliação no Google" },
  { texto: "Atendimento excelente, profissionais incríveis e a localização é ótima.", nome: "Cliente Luminé", fonte: "Destaque das avaliações no Google" },
  { texto: "Uma experiência incrível com um serviço e atendimento de muita qualidade!", nome: "Cliente Luminé", fonte: "Destaque das avaliações no Google" },
  { texto: "Ótimo atendimento, espaço amplo!", nome: "Cliente Luminé", fonte: "Destaque das avaliações no Google" },
];

export const navegacao = [
  { label: "Serviços", href: "#servicos" },
  { label: "Quem somos", href: "#profissionais" },
  { label: "Galeria", href: "#galeria" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];
