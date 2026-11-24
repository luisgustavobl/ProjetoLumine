# Luminé Beauty Club

Plataforma web do **Luminé Beauty Club**, espaço de beleza da maquiadora e educadora **Gleicy Lima** na Praia de Iracema, Fortaleza/CE. Reúne maquiagem, penteados, nails, estética, tattoo e cursos de várias profissionais.

Projeto de extensão da disciplina de Desenvolvimento de Plataformas Web.

**Site no ar:** https://luminebeauty.vercel.app/

---

## Problema

O espaço não tinha um canal digital próprio: portfólio espalhado no Instagram, dúvidas repetidas sobre preços e horários e agendamento todo feito à mão pelo WhatsApp.

## Objetivo

Um site responsivo que apresente a equipe e os trabalhos, mostre as tabelas de preços e receba pedidos de agendamento. E um painel onde as próprias profissionais mantêm agenda, preços e fotos atualizados, sem depender de programador.

---

## Funcionalidades

### Site público
- **Abertura** com esteira de fotos do espaço.
- **Serviços:** ao tocar em um serviço abre a **tabela de preços** daquela área (fixo, "a partir de", faixa ou sob consulta), com botão para já agendar.
- **Profissionais:** card de cada uma com foto, especialidade, formação, Instagram e WhatsApp.
- **Galeria** com filtros (makes, unhas, tattoo, espaço).
- **Depoimentos** reais do Google.
- **Contato:** endereço, mapa, WhatsApp por área e **formulário de agendamento**: a cliente escolhe serviço, profissional, data e horário, o site monta a mensagem e abre o WhatsApp **da profissional** (número cadastrado no painel). Nada é gravado.
- **Tema automático:** *Noir & dourado* no modo escuro e *Pérola* no modo claro, conforme o sistema do visitante.

### Backend
- **Banco PostgreSQL (Supabase)** com profissionais, serviços, tabelas de preço e fotos. O site lê o conteúdo do banco e, se ele cair, usa o conteúdo de reserva de `content.ts` (o site nunca fica fora do ar).
- **Segurança (RLS):** o visitante só lê o conteúdo público; só a equipe logada altera.
- **Storage:** fotos enviadas pelo painel ficam no Supabase Storage.

#### Agendamento online (pronto, mas desligado)
Também existe um agendamento completo, **desligado** em [`site/lib/recursos.ts`](./site/lib/recursos.ts) (`AGENDAMENTO_ONLINE = false`) porque as profissionais já usam o MinhaAgenda e duas agendas gerariam conflito. Ligado, ele oferece:
pedido gravado no banco com código, `POST /api/pedidos` e `GET /api/horarios`, horários ocupados escondidos no site, Agenda e Bloqueios no painel, anti-spam e LGPD completa (consentimento e exclusão automática com `pg_cron`).

### Painel da equipe (`/painel`)
- **Login** com usuário e senha. As contas são criadas pelo responsável pelo site (`npm run usuarios`, veja abaixo); não existe cadastro aberto.
- **Feito para o celular:** abas fixas embaixo da tela (como um app), letra maior, botões grandes; no computador vira barra lateral.
- **Preços:** por serviço (nome, descrição e foto do cartão) e por tabela (fixo, a partir de, faixa ou sob consulta, duração, grupo e observação). Um único **Salvar** grava a página inteira numa função do banco (tudo ou nada); até lá, as edições ficam guardadas no aparelho.
- **Profissionais:** foto de perfil, textos do card, Instagram, **WhatsApp que recebe os pedidos**, formação, serviços que atende e **Visível no site**.
- **Fotos:** grade no estilo Instagram por profissional e do espaço, com o **número da posição** em cada foto. **Segure e arraste** para reordenar (funciona no celular). Envio de várias fotos (reduzidas e convertidas para WebP no navegador), legenda, galeria e abertura. Apagar pede confirmação com 5 s de espera.
- **Segurança:** só quem está na tabela `equipe` acessa (RLS no banco + middleware nas páginas + checagem em cada ação). Ter uma conta no Supabase não basta. O site envia cabeçalhos de segurança (anti-iframe, `nosniff`) e as chaves ficam só em variáveis de ambiente, nunca no repositório.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript |
| Estilo | CSS puro com variáveis (tokens de tema) |
| Backend | Rotas de API do Next.js |
| Banco, login e fotos | [Supabase](https://supabase.com/) (PostgreSQL, Auth e Storage) |
| Hospedagem | [Vercel](https://vercel.com/) (deploy automático a cada push na `main`) |

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

> O `.env.local` está no `.gitignore` e **nunca** deve ser commitado: a chave secreta ignora todas as regras de segurança do banco.

### Deploy (Vercel)

Importe o repositório na Vercel com **Root Directory = `site`** e cadastre em *Settings → Environment Variables* as mesmas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` (a `SUPABASE_DB_URL` só é usada localmente, pelas migrações).

### Contas do painel

Só quem tem o `.env.local` (com a chave secreta) gerencia as contas:

```bash
npm run usuarios -- listar
npm run usuarios -- criar <usuario> "<Nome>" [profissional]
npm run usuarios -- senha <usuario>
npm run usuarios -- remover <usuario>
```

`criar` e `senha` pedem a senha no terminal (ela não aparece na tela). Quem recebe a conta entra em `/painel` com o usuário e a senha.

### Estrutura

```
site/
├── app/
│   ├── layout.tsx        # fontes, metadados e cor do tema
│   ├── page.tsx          # página única (seções)
│   └── globals.css       # estilos e tokens Noir/Pérola
├── app/api/              # pedidos (POST) e horarios (GET)
├── app/painel/           # painel da equipe (login, agenda, bloqueios, preços, fotos…)
├── middleware.ts         # protege /painel e renova o login
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
├── scripts/usuarios.ts   # cria/lista/remove contas do painel e troca senhas
├── lib/recursos.ts       # liga/desliga o agendamento online
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
