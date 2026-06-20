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

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtectedStaff = path.startsWith("/abogados") || path.startsWith("/admin");
  const isProtectedCliente = path.startsWith("/cliente");
  const isProtected = isProtectedStaff || isProtectedCliente;
  const isLogin = path === "/login";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Check if staff (abogado or admin)
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (perfil) {
      // Staff user — redirect away from login and cliente portal
      if (isLogin || isProtectedCliente) {
        const url = request.nextUrl.clone();
        url.pathname = "/abogados";
        return NextResponse.redirect(url);
      }
      // Guard /admin to role=admin only
      if (path.startsWith("/admin") && perfil.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/abogados";
        return NextResponse.redirect(url);
      }
    } else {
      // Not staff — check if portal client
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (cliente) {
        // Portal client — redirect away from login and staff routes
        if (isLogin || isProtectedStaff) {
          const url = request.nextUrl.clone();
          url.pathname = "/cliente";
          return NextResponse.redirect(url);
        }
      } else if (isProtected) {
        // Unknown user on a protected route — back to login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
