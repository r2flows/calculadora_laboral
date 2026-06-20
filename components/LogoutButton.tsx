"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton({ label = "Cerrar sesión" }: { label?: string }) {
  const router = useRouter();
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
      {label}
    </button>
  );
}
