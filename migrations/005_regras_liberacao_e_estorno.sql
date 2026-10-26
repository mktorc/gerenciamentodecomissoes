-- Regras de liberação e estorno de comissões.
--  * GioConcierge e TuristOrlando: comissão liberada pela data de criação (independe de pagamento).
--  * Demais parceiros: liberada quando total_paid >= rack_rate.
--  * Reserva cancelada nunca é liberada para pagamento.
--  * Reserva cancelada cuja comissão já foi paga vira estorno: é descontada do próximo repasse
--    do parceiro e marcada em estorno_compensado_em para não ser descontada duas vezes.

alter table public.reservas add column if not exists estorno_compensado_em timestamptz;

drop index if exists public.reservas_a_pagar_idx;
drop policy if exists reservas_marcar_paga on public.reservas;
alter table public.reservas drop column liberada;

alter table public.reservas add column liberada boolean generated always as (
  hq_status is distinct from 'cancelled'
  and (
    regexp_replace(lower(commission_partner), '[^a-z]', '', 'g') in ('gioconcierge', 'turistorlando')
    or total_paid >= rack_rate
  )
) stored;

create index reservas_a_pagar_idx
  on public.reservas (commission_partner, created_at)
  where liberada and status_repasse = 'pendente';

-- estornos ainda não descontados
create index if not exists reservas_estorno_idx
  on public.reservas (commission_partner)
  where status_repasse = 'paga' and hq_status = 'cancelled' and estorno_compensado_em is null;

create policy reservas_marcar_paga on public.reservas for update to authenticated
  using (public.autorizado() and liberada and status_repasse = 'pendente' and not retida_agencia)
  with check (status_repasse = 'paga');

create policy reservas_compensar_estorno on public.reservas for update to authenticated
  using (public.autorizado() and status_repasse = 'paga' and hq_status = 'cancelled'
         and estorno_compensado_em is null and not retida_agencia)
  with check (estorno_compensado_em is not null);
