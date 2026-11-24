-- =========================================================
-- Salva uma tabela de preços inteira (título, profissionais e itens) de uma vez.
-- Tudo ou nada: se um item for inválido, nada muda.
-- security invoker: roda com as permissões de quem chamou, então o RLS (só equipe) vale.
-- =========================================================

create or replace function salvar_tabela_preco(
  p_tabela text, p_titulo text, p_profissionais text[], p_itens jsonb
) returns void
language plpgsql security invoker set search_path = public as $$
begin
  update tabelas_preco set titulo = p_titulo where id = p_tabela;
  if not found then
    raise exception 'Tabela % não encontrada', p_tabela;
  end if;

  delete from tabela_preco_profissional where tabela_id = p_tabela;
  insert into tabela_preco_profissional (tabela_id, profissional_id)
    select p_tabela, unnest(p_profissionais);

  delete from itens_preco where tabela_id = p_tabela;
  insert into itens_preco (tabela_id, categoria, nome, tipo, valor, valor_max, duracao_min, obs, adicional, ordem)
    select p_tabela, nullif(i->>'categoria', ''), i->>'nome', i->>'tipo',
           (i->>'valor')::numeric, (i->>'valorMax')::numeric, (i->>'duracaoMin')::int,
           nullif(i->>'obs', ''), coalesce((i->>'adicional')::boolean, false), (ord - 1)::int
      from jsonb_array_elements(p_itens) with ordinality as t(i, ord);
end $$;

revoke all on function salvar_tabela_preco(text, text, text[], jsonb) from public, anon;
grant execute on function salvar_tabela_preco(text, text, text[], jsonb) to authenticated;
