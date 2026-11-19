-- =========================================================
-- Luminé Beauty Club — estrutura do banco (PostgreSQL / Supabase)
-- Executado por `npm run db:migrar`. Idempotente: pode rodar de novo.
-- =========================================================

-- ---------- Conteúdo do site (editável no painel) ----------

create table if not exists profissionais (
  id            text primary key,                 -- slug: "gleicy", "evelyne"...
  nome          text not null,
  especialidade text not null,
  sobre         text not null default '',
  tags          text[] not null default '{}',
  instagram     text,                             -- @ sem a arroba
  whatsapp      text,                             -- só dígitos com DDI, ex.: 5585999999999
  retrato_url   text,
  formacao      text[] not null default '{}',     -- cursos/workshops (botão "Ver formação")
  ordem         int not null default 0,
  ativo         boolean not null default true
);

create table if not exists servicos (
  id            text primary key,                 -- "makes", "nails"...
  nome          text not null,
  descricao     text not null default '',
  foto_url      text,                             -- null = ilustração padrão
  rotulo_preco  text,                             -- substitui o "a partir de" do card
  ordem         int not null default 0
);

-- Quem atende cada serviço (filtra o campo "Profissional" do agendamento).
create table if not exists servico_profissional (
  servico_id      text not null references servicos(id) on delete cascade,
  profissional_id text not null references profissionais(id) on delete cascade,
  primary key (servico_id, profissional_id)
);

-- Uma tabela de preços por área (ex.: Nails e estética, de Evelyne e Kamila).
create table if not exists tabelas_preco (
  id            text primary key,
  servico_id    text not null references servicos(id) on delete cascade,
  titulo        text not null,
  ordem         int not null default 0
);

create table if not exists tabela_preco_profissional (
  tabela_id       text not null references tabelas_preco(id) on delete cascade,
  profissional_id text not null references profissionais(id) on delete cascade,
  primary key (tabela_id, profissional_id)
);

create table if not exists itens_preco (
  id            uuid primary key default gen_random_uuid(),
  tabela_id     text not null references tabelas_preco(id) on delete cascade,
  categoria     text,                             -- agrupa itens: "Cílios", "Estética"...
  nome          text not null,
  tipo          text not null check (tipo in ('fixo', 'a_partir', 'faixa', 'consulta')),
  valor         numeric(10, 2) check (valor >= 0),
  valor_max     numeric(10, 2) check (valor_max >= 0),
  duracao_min   int check (duracao_min > 0),
  obs           text,
  adicional     boolean not null default false,   -- não entra no "a partir de" do card
  ordem         int not null default 0,
  constraint faixa_valida check (tipo <> 'faixa' or (valor is not null and valor_max is not null and valor_max >= valor))
);
create index if not exists itens_preco_tabela_idx on itens_preco (tabela_id, ordem);

-- Fotos do portfólio (profissional_id preenchido) e do espaço (profissional_id nulo).
create table if not exists fotos (
  id              uuid primary key default gen_random_uuid(),
  profissional_id text references profissionais(id) on delete cascade,
  url             text not null,                  -- versão menor (cards e grade)
  url_grande      text not null,                  -- versão maior (foto ampliada)
  largura         int not null check (largura > 0),
  altura          int not null check (altura > 0),
  legenda         text not null default '',
  na_galeria      boolean not null default true,
  na_abertura     boolean not null default false, -- entra na esteira do topo do site
  ordem           int not null default 0,
  criado_em       timestamptz not null default now()
);
create index if not exists fotos_profissional_idx on fotos (profissional_id, ordem);

-- ---------- Agenda ----------

create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,         -- código curto mostrado à cliente, ex.: LUM-4F7K
  nome              text not null check (char_length(nome) between 2 and 80),
  telefone          text not null check (char_length(telefone) between 10 and 15), -- só dígitos
  servico_id        text not null references servicos(id),
  profissional_id   text references profissionais(id),
  data              date not null,
  hora              time not null,
  observacoes       text check (char_length(observacoes) <= 500),
  status            text not null default 'pendente'
                    check (status in ('pendente', 'confirmado', 'recusado', 'cancelado')),
  consentimento_em  timestamptz not null,         -- LGPD: quando a cliente aceitou o aviso de privacidade
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index if not exists pedidos_data_idx on pedidos (data, hora);
create index if not exists pedidos_status_idx on pedidos (status, criado_em desc);
-- Impede dois agendamentos confirmados para a mesma profissional no mesmo horário.
create unique index if not exists pedidos_sem_conflito
  on pedidos (profissional_id, data, hora) where status = 'confirmado' and profissional_id is not null;

-- Horários indisponíveis definidos no painel (folga, compromisso, feriado...).
create table if not exists bloqueios (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  text references profissionais(id) on delete cascade, -- nulo = vale para todas
  data             date not null,
  hora_inicio      time,                          -- nulo = dia inteiro
  hora_fim         time,
  motivo           text,
  criado_em        timestamptz not null default now(),
  constraint intervalo_valido check (
    (hora_inicio is null and hora_fim is null) or (hora_inicio is not null and hora_fim is not null and hora_fim > hora_inicio)
  )
);
create index if not exists bloqueios_data_idx on bloqueios (data);

-- Mantém atualizado_em em dia sempre que um pedido muda.
create or replace function tocar_atualizado_em() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists pedidos_atualizado_em on pedidos;
create trigger pedidos_atualizado_em before update on pedidos
  for each row execute function tocar_atualizado_em();

-- ---------- Segurança (Row Level Security) ----------
-- Visitante (anon): só LÊ o conteúdo público. Pedidos são gravados pela API do site
-- (servidor, com validação e anti-spam), nunca direto pelo navegador.
-- Equipe logada (authenticated): acesso total — todas as profissionais podem editar tudo.

do $$
declare
  t text;
begin
  foreach t in array array['profissionais', 'servicos', 'servico_profissional', 'tabelas_preco',
                           'tabela_preco_profissional', 'itens_preco', 'fotos', 'pedidos', 'bloqueios']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists equipe_tudo on %I', t);
    execute format('create policy equipe_tudo on %I for all to authenticated using (true) with check (true)', t);
  end loop;

  foreach t in array array['profissionais', 'servicos', 'servico_profissional', 'tabelas_preco',
                           'tabela_preco_profissional', 'itens_preco', 'fotos']
  loop
    execute format('drop policy if exists publico_le on %I', t);
    execute format('create policy publico_le on %I for select to anon using (true)', t);
  end loop;
end $$;

-- Horários ocupados, SEM dados pessoais: o site usa para esconder horários indisponíveis.
-- Roda com as permissões do dono (security_invoker = false) para ler pedidos sem expô-los.
-- profissional_id nulo = vale para todas; hora_inicio nula = dia inteiro.
drop view if exists horarios_ocupados;
create view horarios_ocupados with (security_invoker = false) as
  select profissional_id, data, hora as hora_inicio, (hora + interval '1 hour')::time as hora_fim
    from pedidos where status = 'confirmado'
  union all
  select profissional_id, data, hora_inicio, hora_fim from bloqueios;
grant select on horarios_ocupados to anon, authenticated;

-- ---------- Arquivos (fotos enviadas pelo painel) ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos_publicas_leitura" on storage.objects;
create policy "fotos_publicas_leitura" on storage.objects for select to anon, authenticated using (bucket_id = 'fotos');
drop policy if exists "fotos_equipe_escreve" on storage.objects;
create policy "fotos_equipe_escreve" on storage.objects for all to authenticated
  using (bucket_id = 'fotos') with check (bucket_id = 'fotos');
