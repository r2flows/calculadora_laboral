import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isStaffRoute  = path.startsWith("/abogados") || path.startsWith("/admin");
    const isClientRoute = path.startsWith("/cliente");
    const isProtected   = isStaffRoute || isClientRoute;
    const isLogin       = path === "/login";

    // Sin sesión → redirigir rutas protegidas al login
    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user) {
      // ── Detectar rol ─────────────────────────────────────────────────────
      let isStaff  = false;
      let isAdmin  = false;
      let isClient = false;

      // 1. Buscar en perfiles (abogados/admin)
      try {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (perfil) {
          isStaff = true;
          isAdmin = perfil.role === "admin";
        }
      } catch { /* no está en perfiles */ }

      // 2. Si no es staff, buscar en clientes
      if (!isStaff) {
        try {
          const { data: cliente, error } = await supabase
            .from("clientes")
            .select("id")
            .eq("auth_user_id", user.id)
            .single();
          if (!error && cliente) isClient = true;
        } catch { /* columna aún no existe o no hay fila */ }
      }

      // ── Redirecciones por rol ─────────────────────────────────────────────
      if (isStaff) {
        if (isLogin || isClientRoute) {
          const url = request.nextUrl.clone();
          url.pathname = "/abogados";
          return NextResponse.redirect(url);
        }
        if (path.startsWith("/admin") && !isAdmin) {
          const url = request.nextUrl.clone();
          url.pathname = "/abogados";
          return NextResponse.redirect(url);
        }
      } else if (isClient) {
        if (isLogin || isStaffRoute) {
          const url = request.nextUrl.clone();
          url.pathname = "/cliente";
          return NextResponse.redirect(url);
        }
      } else if (isProtected) {
        // Usuario auth pero sin rol conocido → logout implícito
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // Si algo falla en auth o DB, dejar pasar sin crash
  }

  return supabaseResponse;
}
