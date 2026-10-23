-- Reservas importadas do HQ Rentals (Commission Partners)
create table if not exists public.reservas (
  id                 uuid primary key default gen_random_uuid(),
  hq_reservation_id  text not null unique,
  commission_partner text not null,
  created_at         timestamptz not null,
  total_price        numeric(12,2) not null default 0,
  total_paid         numeric(12,2) not null default 0,
  rack_rate          numeric(12,2) not null default 0,
  -- informe um dos dois: percentual (ex.: 10 = 10%) ou valor fixo
  commission_rate    numeric(6,3),
  commission_amount  numeric(12,2),

  -- repasse da comissão
  status_repasse     text not null default 'pendente'
                     check (status_repasse in ('pendente', 'paga')),
  paga_em            timestamptz,

  imported_at        timestamptz not null default now(),
  currency           text not null default 'USD',
  payment_methods    text[] not null default '{}',   -- payment_type de cada pagamento no HQ
  retida_agencia     boolean not null default false, -- método "Retenção de comissão": comissão retida na origem
  hq_status          text,                 -- status da reserva no HQ (open, cancelled...)

  -- regra de elegibilidade: total_paid >= rack_rate
  liberada           boolean generated always as (total_paid >= rack_rate) stored,
  -- valor efetivo da comissão: valor fixo tem prioridade; senão, percentual sobre o rack rate
  valor_comissao     numeric(12,2) generated always as (
                       coalesce(commission_amount, round(rack_rate * coalesce(commission_rate, 0) / 100, 2))
                     ) stored,

  constraint comissao_definida check (commission_rate is not null or commission_amount is not null),
  constraint paga_em_coerente  check ((status_repasse = 'paga') = (paga_em is not null))
);

create index if not exists reservas_partner_idx    on public.reservas (commission_partner);
create index if not exists reservas_created_at_idx on public.reservas (created_at);
-- painel "a pagar": liberadas e ainda não repassadas
create index if not exists reservas_a_pagar_idx
  on public.reservas (commission_partner, created_at)
  where liberada and status_repasse = 'pendente';

-- RLS: o acesso é definido em migrations/004_login.sql (usuários logados e autorizados).
alter table public.reservas enable row level security;
