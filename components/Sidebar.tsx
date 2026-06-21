"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavItem { href: string; label: string }

const NAV_ABOGADO: NavItem[] = [
  { href: "/abogados", label: "Dashboard" },
  { href: "/abogados/clientes", label: "Mis clientes" },
  { href: "/abogados/clientes/nuevo", label: "Nuevo cliente" },
  { href: "/abogados/reuniones", label: "Reuniones" },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/clientes", label: "Todos los clientes" },
  { href: "/admin/calculos", label: "Cálculos" },
  { href: "/admin/abogados", label: "Equipo" },
  { href: "/abogados/clientes/nuevo", label: "Nuevo cliente" },
  { href: "/abogados/reuniones", label: "Reuniones" },
];

interface Props {
  role: "admin" | "abogado";
  nombre: string;
}

export default function Sidebar({ role, nombre }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? NAV_ADMIN : NAV_ABOGADO;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-4 border-b border-blue-800">
        <p className="text-xs text-blue-300 uppercase tracking-wide">
          {role === "admin" ? "Administrador" : "Abogado"}
        </p>
        <p className="font-semibold text-sm truncate mt-0.5">{nombre}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-blue-800">
        <a
          href="/finiquito"
          className="block px-3 py-2 text-xs text-blue-300 hover:text-white"
        >
          Ir a calculadora
        </a>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-xs text-blue-300 hover:text-white"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
