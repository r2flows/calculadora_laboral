import { redirect } from "next/navigation";

export default function FiniquitoPage() {
  redirect("/wizard?flujo=finiquito");
}
