import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { labelCausal } from "@/lib/calculos/causalesLegado";
import EliminarClienteButton from "@/components/admin/EliminarClienteButton";

function fmtCLP(v: unknown) {
  const n = Number(v);
  if (!n) return "—";
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function n(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

export default async function ListaCalculos() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, email, estado, resultado_total, datos_calculo, created_at")
    .order("created_at", { ascending: false });

  const rows = (clientes ?? []).map((c) => {
    const datos = c.datos_calculo as Record<string, unknown> | null;
    const r = datos?._resultado as Record<string, unknown> | null;
    const inputs = datos ?? {};
    return { c, inputs, r };
  });

  const withCalculo = rows.filter(({ r }) => r !== null).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cálculos realizados</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {withCalculo} de {rows.length} leads con desglose completo
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Lead</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Causal</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Meses</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Rem. imponible</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Feriado prop.</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Ind. aviso</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Ind. años</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total líquido</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Nulidad</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap text-green-700">Total c/nulidad</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                  Sin leads registrados aún.
                </td>
              </tr>
            )}
            {rows.map(({ c, inputs, r }) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                {/* Lead */}
                <td className="px-4 py-3 min-w-[160px]">
                  <p className="font-medium text-gray-800 truncate max-w-[140px]">{c.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                  </p>
                </td>

                {/* Causal */}
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {r
                    ? labelCausal(inputs.causal)
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Meses trabajados */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r
                    ? `${n(r.mesesTrabajados)}m ${n(r.diasTrabajados)}d`
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Remuneración imponible */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r ? fmtCLP(r.remuneracionImponibleTotal) : <span className="text-gray-300">—</span>}
                </td>

                {/* Feriado proporcional */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r
                    ? (<span title={`${n(r.feriadoProporcionalDias)} días hábiles`}>{fmtCLP(r.feriadoProporcionalMonto)}</span>)
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Indemnización aviso previo */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r
                    ? (n(r.indemnizacionAvisoPrevio) > 0 ? fmtCLP(r.indemnizacionAvisoPrevio) : <span className="text-gray-300">—</span>)
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Indemnización años de servicio */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r
                    ? (n(r.indemnizacionAnosServicio) > 0 ? fmtCLP(r.indemnizacionAnosServicio) : <span className="text-gray-300">—</span>)
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Total líquido */}
                <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                  {r ? fmtCLP(r.totalLiquido) : <span className="text-gray-300">—</span>}
                </td>

                {/* Nulidad */}
                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                  {r
                    ? (n(r.montoNulidad) > 0
                        ? <span title={`${n(r.diasNulidad)} días`}>{fmtCLP(r.montoNulidad)}</span>
                        : <span className="text-gray-300">—</span>)
                    : <span className="text-gray-300">—</span>
                  }
                </td>

                {/* Total con nulidad */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-bold text-green-700">{fmtCLP(c.resultado_total)}</span>
                </td>

                {/* Enlace */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/calculos/${c.id}`}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Ver auditoría →
                    </Link>
                    <EliminarClienteButton clienteId={c.id} nombre={c.nombre} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {withCalculo < rows.length && (
        <p className="text-xs text-gray-400">
          Los leads con "—" usaron la calculadora antes del último deploy y no tienen desglose guardado.
        </p>
      )}
    </div>
  );
}
