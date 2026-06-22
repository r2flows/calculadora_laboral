import FormularioCotizaciones from "@/components/FormularioCotizaciones";

export default function CotizacionesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-800">Revisar Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Detecta errores en AFP, salud y AFC — posible nulidad del despido</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <FormularioCotizaciones />
        </div>
      </div>
    </main>
  );
}
