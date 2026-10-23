-- Acesso só para usuários logados E autorizados.
-- A lista de autorizados evita que alguém que se cadastre sozinho no Auth leia os dados.
create table if not exists public.usuarios_autorizados (email text primary key);
alter table public.usuarios_autorizados enable row level security; -- sem policies: ninguém lê pela API

insert into public.usuarios_autorizados (email) values ('marketing@orlandorentcar.com')
on conflict do nothing;

create or replace function public.autorizado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuarios_autorizados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.autorizado() from public;
grant execute on function public.autorizado() to authenticated;

drop policy if exists reservas_select on public.reservas;
drop policy if exists reservas_marcar_paga on public.reservas;

create policy reservas_select on public.reservas for select to authenticated
  using (public.autorizado());

create policy reservas_marcar_paga on public.reservas for update to authenticated
  using (public.autorizado() and liberada and status_repasse = 'pendente' and not retida_agencia)
  with check (status_repasse = 'paga');
