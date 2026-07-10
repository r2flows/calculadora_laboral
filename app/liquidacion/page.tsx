import { redirect } from "next/navigation";

export default function LiquidacionPage() {
  redirect("/wizard?flujo=liquidacion");
}
