-- =========================================================
-- Salva a página de Preços inteira de uma vez (botão "Salvar" do painel):
-- serviços novos/renomeados, tabelas novas, alteradas e apagadas.
-- Tudo ou nada: se qualquer parte falhar, nada muda.
-- security invoker: o RLS (só a equipe altera) continua valendo.
-- =========================================================

create or replace function salvar_precos(p_servicos jsonb, p_tabelas jsonb, p_removidas text[]) returns void
language plpgsql security invoker set search_path = public as $$
declare
  s jsonb;
  t jsonb;
  proxima_ordem int;
begin
  -- Serviços: novos entram no fim; existentes só mudam nome e descrição.
  for s in select * from jsonb_array_elements(p_servicos) loop
    if (s->>'novo')::boolean then
      if exists (select 1 from servicos where id = s->>'id') then
        raise exception 'Já existe um serviço com o id %', s->>'id';
      end if;
      select coalesce(max(ordem), -1) + 1 into proxima_ordem from servicos;
      insert into servicos (id, nome, descricao, ordem) values (s->>'id', s->>'nome', s->>'descricao', proxima_ordem);
    else
      update servicos set nome = s->>'nome', descricao = s->>'descricao' where id = s->>'id';
    end if;
  end loop;

  delete from tabelas_preco where id = any(p_removidas);

  -- Tabelas: cria as novas e grava título, profissionais e itens (função da migração 004).
  for t in select * from jsonb_array_elements(p_tabelas) loop
    if (t->>'nova')::boolean then
      select coalesce(max(ordem), -1) + 1 into proxima_ordem from tabelas_preco;
      insert into tabelas_preco (id, servico_id, titulo, ordem) values (t->>'id', t->>'servicoId', t->>'titulo', proxima_ordem);
    end if;
    perform salvar_tabela_preco(
      t->>'id', t->>'titulo',
      array(select jsonb_array_elements_text(t->'profissionais')),
      t->'itens'
    );
  end loop;
end $$;

revoke all on function salvar_precos(jsonb, jsonb, text[]) from public, anon;
grant execute on function salvar_precos(jsonb, jsonb, text[]) to authenticated;
