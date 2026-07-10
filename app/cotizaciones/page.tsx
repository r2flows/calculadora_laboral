import { redirect } from "next/navigation";

export default function CotizacionesPage() {
  redirect("/wizard?flujo=cotizaciones");
}
