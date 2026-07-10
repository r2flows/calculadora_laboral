import Wizard, { type Flujo } from "@/components/wizard/Wizard";

const FLUJOS_VALIDOS: Flujo[] = ["finiquito", "liquidacion", "cotizaciones"];

export default function WizardPage({
  searchParams,
}: {
  searchParams: { flujo?: string };
}) {
  const flujo = FLUJOS_VALIDOS.includes(searchParams.flujo as Flujo)
    ? (searchParams.flujo as Flujo)
    : null;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <Wizard flujoInicial={flujo} />
    </div>
  );
}
