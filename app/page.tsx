import Link from "next/link";

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconGavel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
    </svg>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-normal">empowered by</span>
          <span className="font-semibold tracking-tight text-white">AgentLoop</span>
        </div>
        <Link
          href="/cliente"
          className="text-sm text-white font-medium border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg transition-all"
        >
          Mi cuenta
        </Link>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] overflow-hidden px-4 pt-24 pb-28 text-center">

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(148,163,184,.1) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(148,163,184,.1) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "52px 52px",
          }}
        />

        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-700/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-cyan-600/10 blur-[80px]" />
        </div>

        {/* Floating legal elements — decorative */}
        <div className="absolute top-28 right-8 sm:right-16 opacity-10 rotate-12 hidden md:block">
          <IconGavel className="w-20 h-20 text-cyan-300" />
        </div>
        <div className="absolute bottom-32 left-8 sm:left-16 opacity-10 -rotate-6 hidden md:block">
          <IconFile className="w-16 h-16 text-blue-300" />
        </div>

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold px-4 py-2 rounded-full mb-7">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Gratis · Sin registro · Sin datos personales obligatorios
        </div>

        {/* Heading */}
        <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6 max-w-3xl">
          Calcula tu finiquito{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-500">
            con precisión legal
          </span>
        </h1>

        {/* Subtitle */}
        <p className="relative text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-9">
          Herramienta basada en el Código del Trabajo chileno vigente.
          Obtén en segundos el desglose completo de lo que te corresponde:
          indemnizaciones, vacaciones, nulidad del despido y más.
        </p>

        {/* CTA */}
        <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/finiquito"
            className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-base px-9 py-4 rounded-xl transition-all shadow-2xl shadow-blue-900/50 hover:shadow-blue-700/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <IconCalc className="w-5 h-5" />
            Calcular mi finiquito
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* Legal tags */}
        <div className="relative mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2 text-xs text-slate-500">
          {[
            { icon: "⚖️", text: "Código del Trabajo Art. 159–163" },
            { icon: "📋", text: "Ley 21.561 — Jornada 42h vigente" },
            { icon: "💰", text: "IMM $553.553 (mayo 2026)" },
            { icon: "🔒", text: "Nulidad del despido incluida" },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <span>{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── Wave separator ─────────────────────────────────────────────────── */}
      <div className="relative bg-slate-950 -mt-1">
        <svg viewBox="0 0 1440 64" className="w-full block" fill="white" preserveAspectRatio="none">
          <path d="M0 64L0 32Q360 0 720 20Q1080 40 1440 10L1440 64Z" />
        </svg>
      </div>

      {/* ── Cómo funciona ──────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
              Simple y rápido
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Tres pasos para saber cuánto te deben
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-7 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100" />

            {[
              {
                n: "01",
                icon: <IconFile className="w-6 h-6 text-blue-600" />,
                title: "Ingresa tus datos",
                desc: "Fechas, sueldo, causal de despido y prestaciones. El formulario te guía con indicaciones en cada campo.",
              },
              {
                n: "02",
                icon: <IconZap className="w-6 h-6 text-blue-600" />,
                title: "Cálculo automático",
                desc: "Aplicamos las fórmulas exactas del CT: gratificación, feriado proporcional, indemnizaciones por año de servicio.",
              },
              {
                n: "03",
                icon: <IconUsers className="w-6 h-6 text-blue-600" />,
                title: "Habla con un abogado",
                desc: "Comparte el resultado y te asesoramos para recuperar lo que te corresponde, sin letra chica.",
              },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="relative text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center shadow-sm">
                    {icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {n.slice(1)}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
              Por qué elegirnos
            </p>
            <h2 className="text-3xl font-extrabold text-white">
              Tecnología al servicio de tus derechos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <IconGavel className="w-7 h-7 text-cyan-400" />,
                accent: "border-cyan-800/50",
                glow: "bg-cyan-500/5",
                tag: "Precisión legal",
                title: "Código del Trabajo actualizado",
                desc: "Tablas vigentes de AFP, IMM y jornada máxima según Ley 21.561. Cálculos validados artículo por artículo.",
              },
              {
                icon: <IconZap className="w-7 h-7 text-blue-400" />,
                accent: "border-blue-800/50",
                glow: "bg-blue-500/5",
                tag: "Rapidez",
                title: "Resultado en segundos",
                desc: "Sin esperas ni registros obligatorios. Ingresa tus datos y obtén el desglose completo de inmediato.",
              },
              {
                icon: <IconShield className="w-7 h-7 text-emerald-400" />,
                accent: "border-emerald-800/50",
                glow: "bg-emerald-500/5",
                tag: "Asesoría",
                title: "Abogados laborales reales",
                desc: "Un equipo especializado revisa tu caso, contesta tus dudas y te acompaña si decides demandar.",
              },
            ].map(({ icon, accent, glow, tag, title, desc }) => (
              <div
                key={title}
                className={`relative p-6 rounded-2xl border ${accent} ${glow} hover:border-white/20 transition-all hover:-translate-y-0.5 space-y-4`}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 opacity-10"
                  style={{ background: "radial-gradient(circle at top right, white, transparent)" }} />

                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{tag}</p>
                  <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Qué incluye el cálculo ─────────────────────────────────────────── */}
      <section className="bg-slate-900 py-16 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
            Qué calcula la herramienta
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              "Feriado proporcional",
              "Indemnización por años de servicio",
              "Aviso previo",
              "Gratificación mensual legal",
              "Remuneración últimos días",
              "Nulidad del despido",
              "Impuesto 2ª categoría",
              "Cotizaciones AFP y salud",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300"
              >
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950 py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            ¿Te despidieron? <br className="hidden sm:block" />
            <span className="text-cyan-300">Conoce lo que te deben.</span>
          </h2>
          <p className="text-blue-200 leading-relaxed">
            Muchos trabajadores reciben menos de lo que les corresponde por
            desconocer la ley. Calcula en segundos, sin costo y sin compromiso.
          </p>
          <Link
            href="/finiquito"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold text-base px-9 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-2xl"
          >
            <IconCalc className="w-5 h-5" />
            Calcular mi finiquito gratis
          </Link>
          <p className="text-xs text-slate-500">Sin registro · Resultado inmediato · Confidencial</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/5 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <IconGavel className="w-4 h-4 text-slate-700" />
            <span>LaborCalc Chile · 2026</span>
          </div>
          <p>Información orientativa. No reemplaza asesoría jurídica profesional.</p>
          <Link href="/login" className="text-slate-700 hover:text-slate-500 transition-colors">
            Administración
          </Link>
        </div>
      </footer>

    </div>
  );
}
