-- Comissão passa a ser percentual sobre o rack rate (antes: total_revenue)
alter table public.reservas drop column valor_comissao;
alter table public.reservas add column valor_comissao numeric(12,2) generated always as (
  coalesce(commission_amount, round(rack_rate * coalesce(commission_rate, 0) / 100, 2))
) stored;
alter table public.reservas drop column if exists commission_base;
