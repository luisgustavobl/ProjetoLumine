-- =========================================================
-- Reordena fotos de uma vez (arrastar e soltar no painel).
-- Recebe os ids na nova ordem; a posição na lista vira a "ordem".
-- security invoker: vale o RLS (só a equipe consegue alterar).
-- =========================================================

create or replace function reordenar_fotos(p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update fotos f
     set ordem = nova.posicao
    from unnest(p_ids) with ordinality as nova(id, posicao)
   where f.id = nova.id;
$$;

revoke all on function reordenar_fotos(uuid[]) from public, anon;
grant execute on function reordenar_fotos(uuid[]) to authenticated;
