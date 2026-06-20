import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin env vars no podemos autenticar — dejar pasar sin crash
  if (!supabaseUrl || !supabaseAnon) return supabaseResponse;

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
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
  });

  const path        = request.nextUrl.pathname;
  const isProtected = path.startsWith("/abogados") || path.startsWith("/admin") || path.startsWith("/cliente");
  const isLogin     = path === "/login";

  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // No session o fallo de red — dejar pasar
    return supabaseResponse;
  }

  // Sin sesión → rutas protegidas van al login
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión → determinar destino
  if (user) {
    let perfilRole: string | null = null;

    try {
      const { data } = await supabase
        .from("perfiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) perfilRole = data.role;
    } catch { /* sin perfil */ }

    if (perfilRole !== null) {
      // Usuario staff (abogado o admin)
      if (isLogin) {
        const url = request.nextUrl.clone();
        url.pathname = perfilRole === "admin" ? "/admin" : "/abogados";
        return NextResponse.redirect(url);
      }
      if (path.startsWith("/cliente")) {
        const url = request.nextUrl.clone();
        url.pathname = "/abogados";
        return NextResponse.redirect(url);
      }
      if (path.startsWith("/admin") && perfilRole !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/abogados";
        return NextResponse.redirect(url);
      }
    } else {
      // Posible cliente del portal
      let isPortalClient = false;
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (!error && data) isPortalClient = true;
      } catch { /* columna no existe aún */ }

      if (isPortalClient) {
        if (isLogin || path.startsWith("/abogados") || path.startsWith("/admin")) {
          const url = request.nextUrl.clone();
          url.pathname = "/cliente";
          return NextResponse.redirect(url);
        }
      } else if (isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
