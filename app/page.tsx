import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">empowered by</span>
          <span className="text-sm font-semibold text-gray-800 tracking-tight">AgentLoop</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-gray-600 font-medium border border-gray-200 hover:border-gray-400 hover:text-gray-800 px-4 py-1.5 rounded-lg transition-all"
        >
          Mi cuenta
        </Link>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Title */}
          <div className="text-center space-y-3">
            <span className="text-4xl">⚖️</span>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Conoce tus derechos<br />en minutos
            </h1>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="text-green-500 font-bold">✓</span> Gratuito
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500 font-bold">✓</span> Sin registro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500 font-bold">✓</span> Confidencial
              </span>
            </div>
          </div>

          {/* Service cards */}
          <div className="space-y-3">

            {/* Card 1 — Finiquito */}
            <Link
              href="/finiquito"
              className="group flex items-start justify-between gap-4 p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">💼</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-base">Calcular Finiquito</p>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">V2 IA</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Suba sus documentos y calculamos todo: feriado, indemnización, recargo, nulidad.
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0 text-lg">→</span>
            </Link>

            {/* Card 2 — Liquidación */}
            <Link
              href="/liquidacion"
              className="group flex items-start justify-between gap-4 p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">🧾</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-base">Verificar Liquidación</p>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">V2 IA</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Suba su liquidación y comprobante — detectamos errores al instante.
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0 text-lg">→</span>
            </Link>

            {/* Card 3 — Cotizaciones */}
            <Link
              href="/cotizaciones"
              className="group flex items-start justify-between gap-4 p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">🔍</span>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900 text-base">Revisar Cotizaciones</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Detecta si te cotizaron mal en AFP, salud o si hay nulidad del despido.
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0 text-lg">→</span>
            </Link>

          </div>

          {/* Contact CTA */}
          <div className="text-center space-y-1 pt-2">
            <p className="text-sm text-gray-400">¿Necesitas asesoría personalizada?</p>
            <a
              href="https://wa.me/56944044004"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Habla con un abogado →
            </a>
          </div>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-5 px-6">
        <div className="max-w-sm mx-auto flex justify-between items-center text-xs text-gray-400">
          <span>Asesoría laboral · Chile · 2026</span>
          <Link href="/login" className="hover:text-gray-600 transition-colors">
            Administración
          </Link>
        </div>
      </footer>

    </div>
  );
}
