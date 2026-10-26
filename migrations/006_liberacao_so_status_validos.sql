-- Só reservas com status open, completed ou rental entram para pagamento.
-- Quote, pending, cancelled etc. não são liberadas.
-- Estornos não dependem de "liberada": reserva cancelada com comissão já paga continua sendo
-- descontada do próximo repasse (ver migration 005).

drop index if exists public.reservas_a_pagar_idx;
drop policy if exists reservas_marcar_paga on public.reservas;
alter table public.reservas drop column liberada;

alter table public.reservas add column liberada boolean generated always as (
  hq_status in ('open', 'completed', 'rental')
  and (
    regexp_replace(lower(commission_partner), '[^a-z]', '', 'g') in ('gioconcierge', 'turistorlando')
    or total_paid >= rack_rate
  )
) stored;

create index reservas_a_pagar_idx
  on public.reservas (commission_partner, created_at)
  where liberada and status_repasse = 'pendente';

create policy reservas_marcar_paga on public.reservas for update to authenticated
  using (public.autorizado() and liberada and status_repasse = 'pendente' and not retida_agencia)
  with check (status_repasse = 'paga');
