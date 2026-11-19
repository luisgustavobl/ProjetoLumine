# Luminé Beauty Club

Plataforma web do **Luminé Beauty Club**, espaço de beleza da maquiadora e educadora **Gleicy Lima** na Praia de Iracema, Fortaleza/CE. Reúne maquiagem, penteados, nails, estética, tattoo e cursos de várias profissionais.

Projeto de extensão da disciplina de Desenvolvimento de Plataformas Web.

---

## Problema

O espaço não tinha um canal digital próprio: portfólio espalhado no Instagram, dúvidas repetidas sobre preços e horários e agendamento todo feito à mão pelo WhatsApp.

## Objetivo

Um site responsivo que apresente a equipe e os trabalhos, mostre as tabelas de preços e receba pedidos de agendamento. E um painel onde as próprias profissionais mantêm agenda, preços e fotos atualizados, sem depender de programador.

---

## Funcionalidades

### Site público (pronto)
- **Abertura** com esteira de fotos do espaço.
- **Serviços:** ao tocar em um serviço abre a **tabela de preços** daquela área (fixo, "a partir de", faixa ou sob consulta), com botão para já agendar.
- **Profissionais:** card de cada profissional com Instagram, carrossel de trabalhos, foto ampliada e formação da Gleicy.
- **Galeria** com filtros (makes, unhas, tattoo, espaço).
- **Depoimentos** reais do Google.
- **Contato:** endereço, mapa, WhatsApp por área e **formulário de pedido de agendamento** que monta a mensagem e abre o WhatsApp.
- **Tema automático:** *Noir & dourado* no modo escuro e *Pérola* no modo claro, conforme o sistema do visitante.

### Backend (pronto)
- **Banco PostgreSQL (Supabase)** com profissionais, serviços, tabelas de preço, fotos, pedidos e bloqueios de horário. O site lê o conteúdo do banco e, se ele cair, usa o conteúdo de reserva de `content.ts`.
- **`POST /api/pedidos`:** valida os dados, confere se o horário está livre, grava o pedido como *pendente* e devolve um código (ex.: `LUM-7KQ2M`). A cliente então continua a conversa no WhatsApp da profissional, já com o código.
- **`GET /api/horarios`:** horários ocupados de um dia (pedidos confirmados e bloqueios), sem dados pessoais.
- **Segurança (RLS):** o visitante só lê o conteúdo público. Pedidos só entram pela API e só a equipe logada consegue lê-los.
- **Anti-spam:** campo-armadilha, tempo mínimo de preenchimento, limite por IP e por telefone.
- **LGPD:** consentimento obrigatório, [aviso de privacidade](./site/app/privacidade/page.tsx) e exclusão automática diária de pedidos antigos (`pg_cron`).

### Painel das profissionais (em desenvolvimento)
- `/painel` com login (e-mail/usuário e senha): agenda dos pedidos (confirmar, recusar, responder no WhatsApp), bloqueio de horários, tabelas de preço, WhatsApp de cada profissional, fotos e usuários.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript |
| Estilo | CSS puro com variáveis (tokens de tema) |
| Backend | Rotas de API do Next.js |
| Banco, login e fotos | [Supabase](https://supabase.com/) (PostgreSQL, Auth e Storage), em implantação |
| Hospedagem | [Vercel](https://vercel.com/), em implantação |

---

## Como rodar

O site fica na pasta [`site/`](./site).

```bash
cd site
npm install
npm run dev
```

Acesse [http://localhost:3001](http://localhost:3001).

### Banco de dados

1. Crie um projeto no [Supabase](https://supabase.com/) e preencha `site/.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_DB_URL` (Connect → Session pooler).
2. Crie as tabelas e a carga inicial:

```bash
npm run db:migrar
```

As migrações ficam em `site/supabase/migrations/`. Rodar de novo é seguro: a carga inicial só acontece com o banco vazio.

### Estrutura

```
site/
├── app/
│   ├── layout.tsx        # fontes, metadados e cor do tema
│   ├── page.tsx          # página única (seções)
│   └── globals.css       # estilos e tokens Noir/Pérola
├── app/api/              # pedidos (POST) e horarios (GET)
├── app/privacidade/      # aviso de privacidade (LGPD)
├── components/           # Navbar, Servicos (tabela de preços), Profissionais, Carrossel,
│                         # Galeria, Lightbox, Depoimentos, Agendamento, Modal, Logo
├── lib/
│   ├── dados.ts          # lê o conteúdo do banco (com reserva estática)
│   ├── agenda.ts         # regras de horário, compartilhadas por formulário e API
│   ├── validacao.ts      # validação do pedido
│   ├── ocupacoes.ts      # horários ocupados no banco
│   ├── supabase.ts       # clientes do banco (só no servidor)
│   └── util.ts           # imagens, preços, link do WhatsApp
├── scripts/migrar.ts     # aplica migrações e carga inicial
├── supabase/migrations/  # estrutura do banco (SQL)
├── content.ts            # conteúdo inicial: profissionais, serviços, preços, fotos
└── public/img/           # fotos em WebP (480 e 960 px)
```

Os preços em `content.ts` vêm das agendas online da Gleicy e da Evelyne. O que não tem preço publicado aparece como "sob consulta" até a equipe definir no painel.

---

## Equipe de desenvolvimento

* Luís Gustavo
* Wanessa Vieira
* Yeimar Mendez
* Ângelo Mendonça

---

## Apresentação do projeto

Slides da apresentação inicial: [docs/ProjetoLumine_comprimido.pdf](./docs/ProjetoLumine_comprimido.pdf).
