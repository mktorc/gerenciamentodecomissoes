-- Rode no SQL Editor do Supabase (banco já criado com a versão anterior do schema.sql)
alter table public.reservas
  add column if not exists currency        text not null default 'USD',
  add column if not exists hq_status       text,
  add column if not exists commission_base numeric(12,2);

-- comissão = percentual sobre commission_base (total_revenue do HQ);
-- sem base (ex.: dados de teste), usa total_price
alter table public.reservas drop column valor_comissao;
alter table public.reservas add column valor_comissao numeric(12,2) generated always as (
  coalesce(commission_amount, round(coalesce(commission_base, total_price) * coalesce(commission_rate, 0) / 100, 2))
) stored;
