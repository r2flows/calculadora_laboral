-- Habilita Row Level Security en las tablas del schema public expuestas por
-- PostgREST (perfiles, clientes, documentos), que quedaron sin RLS desde la
-- migración inicial. Sin esto, cualquiera con la anon key (pública, va en el
-- bundle del navegador) podía leer/editar/borrar todos los leads, clientes y
-- documentos vía REST directo, sin pasar por la app.
--
-- Las rutas /api/* que usan SUPABASE_SERVICE_ROLE_KEY (lib/supabase/admin.ts)
-- no se ven afectadas: ese rol tiene BYPASSRLS y no pasa por estas policies.
--
-- Las policies replican el acceso que la app ya hace hoy vía la anon key
-- desde el navegador (lib/supabase/client.ts) y desde componentes de
-- servidor con la sesión del usuario (lib/supabase/server.ts):
--   - admin/abogado (perfiles.role) -> acceso total a clientes/documentos
--   - cliente final (clientes.auth_user_id) -> solo su propio registro

-- Funciones SECURITY DEFINER para poder consultar el rol del usuario actual
-- dentro de policies sobre la propia tabla perfiles sin caer en recursión de
-- RLS (patrón recomendado por Supabase).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and role in ('admin', 'abogado')
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_staff() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- perfiles --------------------------------------------------------------

alter table public.perfiles enable row level security;

create policy "perfiles: ver propio perfil"
  on public.perfiles for select
  using (id = auth.uid());

create policy "perfiles: admin ve todos"
  on public.perfiles for select
  using (public.is_admin());

-- clientes ----------------------------------------------------------------

alter table public.clientes enable row level security;

create policy "clientes: staff ve todos"
  on public.clientes for select
  using (public.is_staff());

create policy "clientes: cliente ve su propio registro"
  on public.clientes for select
  using (auth_user_id = auth.uid());

create policy "clientes: staff crea"
  on public.clientes for insert
  with check (public.is_staff());

create policy "clientes: staff actualiza"
  on public.clientes for update
  using (public.is_staff())
  with check (public.is_staff());

-- documentos --------------------------------------------------------------

alter table public.documentos enable row level security;

create policy "documentos: staff ve todos"
  on public.documentos for select
  using (public.is_staff());

create policy "documentos: cliente ve los suyos"
  on public.documentos for select
  using (
    exists (
      select 1 from public.clientes c
      where c.id = documentos.cliente_id
        and c.auth_user_id = auth.uid()
    )
  );
