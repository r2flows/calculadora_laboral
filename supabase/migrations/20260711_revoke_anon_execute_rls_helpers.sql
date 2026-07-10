-- Supabase crea funciones nuevas con EXECUTE otorgado por defecto a anon/
-- authenticated/service_role (ALTER DEFAULT PRIVILEGES), lo que el linter de
-- seguridad marca como advertencia para funciones SECURITY DEFINER. Estas
-- funciones son inofensivas para anon (auth.uid() es null sin sesión, así que
-- siempre devuelven false), pero les sacamos el acceso igual por buena
-- práctica: nadie sin sesión necesita invocarlas.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_staff() from anon;
