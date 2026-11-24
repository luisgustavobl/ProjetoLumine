-- =========================================================
-- Equipe do painel: quem pode entrar e editar.
-- Ter uma conta no Supabase Auth NÃO basta: a pessoa precisa estar nesta tabela.
-- Assim, mesmo que alguém consiga criar uma conta, não acessa nada.
-- =========================================================

create table if not exists equipe (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  nome             text not null,
  usuario          text not null unique,          -- login curto (ex.: "gleicy") ou e-mail
  admin            boolean not null default false, -- pode criar/alterar/remover usuários
  profissional_id  text references profissionais(id) on delete set null,
  criado_em        timestamptz not null default now()
);

-- Verdadeiro se quem está logado faz parte da equipe.
-- security definer: lê a tabela equipe sem depender das próprias regras de RLS dela.
create or replace function eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from equipe where user_id = auth.uid());
$$;

create or replace function eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from equipe where user_id = auth.uid() and admin);
$$;

-- Troca a regra "qualquer logado pode tudo" por "só a equipe pode tudo".
do $$
declare
  t text;
begin
  foreach t in array array['profissionais', 'servicos', 'servico_profissional', 'tabelas_preco',
                           'tabela_preco_profissional', 'itens_preco', 'fotos', 'pedidos', 'bloqueios']
  loop
    execute format('drop policy if exists equipe_tudo on %I', t);
    execute format('create policy equipe_tudo on %I for all to authenticated using (eh_equipe()) with check (eh_equipe())', t);
  end loop;
end $$;

-- A equipe se vê; só admin altera (o painel usa a chave secreta para criar contas).
alter table equipe enable row level security;
drop policy if exists equipe_le on equipe;
create policy equipe_le on equipe for select to authenticated using (eh_equipe());
drop policy if exists admin_altera on equipe;
create policy admin_altera on equipe for all to authenticated using (eh_admin()) with check (eh_admin());

-- Fotos no Storage: só a equipe envia/apaga.
drop policy if exists "fotos_equipe_escreve" on storage.objects;
create policy "fotos_equipe_escreve" on storage.objects for all to authenticated
  using (bucket_id = 'fotos' and public.eh_equipe()) with check (bucket_id = 'fotos' and public.eh_equipe());
