-- Retenção de comissão: parceiro recebeu o pagamento do cliente e já reteve a comissão na origem
alter table public.reservas
  add column if not exists payment_methods text[] not null default '{}',
  add column if not exists retida_agencia  boolean not null default false;

-- a policy de repasse também não pode alcançar reservas retidas
drop policy if exists reservas_marcar_paga on public.reservas;
create policy reservas_marcar_paga on public.reservas for update to anon
  using (liberada and status_repasse = 'pendente' and not retida_agencia)
  with check (status_repasse = 'paga');
