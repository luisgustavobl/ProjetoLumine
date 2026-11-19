-- =========================================================
-- LGPD: dados pessoais guardados só pelo tempo necessário.
-- - Pedidos recusados/cancelados: apagados 30 dias depois do pedido.
-- - Demais pedidos: apagados 180 dias depois da data do atendimento.
-- A limpeza roda todo dia às 3h (horário de Brasília = 6h UTC) via pg_cron.
-- =========================================================

create or replace function limpar_pedidos_antigos() returns int
language plpgsql security definer set search_path = public as $$
declare
  apagados int;
begin
  delete from pedidos
   where (status in ('recusado', 'cancelado') and criado_em < now() - interval '30 days')
      or data < current_date - interval '180 days';
  get diagnostics apagados = row_count;
  return apagados;
end $$;

revoke all on function limpar_pedidos_antigos() from public, anon, authenticated;

create extension if not exists pg_cron;

-- Reagenda sem duplicar se a migração rodar de novo.
select cron.unschedule(jobid) from cron.job where jobname = 'limpar-pedidos-antigos';
select cron.schedule('limpar-pedidos-antigos', '0 6 * * *', 'select public.limpar_pedidos_antigos()');
