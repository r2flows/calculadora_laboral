import ArbolDecisionFiniquito from "@/components/admin/ArbolDecisionFiniquito";

export default function AlgoritmoPage() {
  return (
    <div className="h-full flex flex-col space-y-3">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Árbol del algoritmo — Finiquito</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Mapa completo de las decisiones y fórmulas del motor de cálculo, con las tasas y topes
          vigentes hoy. Usa scroll/pellizco para hacer zoom y arrastra para moverte.
        </p>
      </div>
      <div className="flex-1 min-h-[75vh] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ArbolDecisionFiniquito />
      </div>
    </div>
  );
}
