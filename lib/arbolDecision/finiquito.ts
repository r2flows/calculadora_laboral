import type { AFP } from "@/lib/calculos/tipos";
import {
  utmVigente,
  ufVigente,
  tasaAfpVigente,
  TASA_FONASA,
  TASA_FONASA_CON_CAJA,
  TASA_AFC_TRABAJADOR_INDEFINIDO,
  TASA_AFC_EMPLEADOR_INDEFINIDO,
  TASA_AFC_EMPLEADOR_PLAZO_OBRA,
} from "@/lib/calculos/vigencias";
import { immVigente, topeGratificacionMensual } from "@/lib/calculos/jornada";
import { TRAMOS_IMPUESTO } from "@/lib/calculos/impuesto";

export type TipoNodo = "entrada" | "calculo" | "decision" | "total";

export interface NodoArbol {
  id: string;
  tipo: TipoNodo;
  titulo: string;
  formula?: string;
  valores?: string[];
  nota?: string;
  fuente?: string;
  depende: string[];
}

export interface EdgeArbol {
  id: string;
  source: string;
  target: string;
}

const AFPS: AFP[] = ["Capital", "Cuprum", "Habitat", "Modelo", "PlanVital", "Provida", "Uno"];

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/**
 * Nodos del árbol. Varias cadenas de pasos mecánicos de una sola fórmula (feriado
 * proporcional, gratificación→imponible, horas extra, impuesto) se fusionan en un solo
 * nodo con la fórmula completa adentro, en vez de un nodo por sub-paso — reduce el
 * número de nodos/conexiones sin perder ninguna fórmula, para que el grafo sea más
 * legible (ver conversación: "muchas líneas" era el problema reportado).
 */
function definirNodos(hoy: string): Omit<NodoArbol, "posicion">[] {
  return [
    // ── Entradas ────────────────────────────────────────────────────────
    { id: "in_fechas", tipo: "entrada", titulo: "Fechas del contrato",
      formula: "Fecha de inicio, fecha de término, fecha de consulta (hoy)", depende: [] },
    { id: "in_causal", tipo: "entrada", titulo: "Causal de término + contexto",
      formula: "Causal invocada, ¿se invocó correctamente?, ¿hay pruebas de despido injustificado?, ¿recibió carta con 30 días de aviso?",
      depende: [] },
    { id: "in_contrato", tipo: "entrada", titulo: "Tipo de contrato",
      formula: "indefinido / plazo fijo / obra o faena", depende: [] },
    { id: "in_remuneracion", tipo: "entrada", titulo: "Remuneración pactada",
      formula: "Sueldo base, movilización, colación, ¿recibe gratificación?, monto fijo de gratificación (0 = automático)",
      depende: [] },
    { id: "in_prevision", tipo: "entrada", titulo: "Previsión",
      formula: "AFP, tipo de salud (Fonasa/Isapre), monto mensual Isapre", depende: [] },
    { id: "in_vacaciones", tipo: "entrada", titulo: "Vacaciones",
      formula: "Días de vacaciones anuales pactados, días ya tomados durante el contrato", depende: [] },
    { id: "in_jornada", tipo: "entrada", titulo: "Jornada y horas extra",
      formula: "Jornada semanal pactada (horas), horas y minutos extra permanentes por mes", depende: [] },
    { id: "in_descuentos", tipo: "entrada", titulo: "Descuentos y beneficios del mes",
      formula: "Anticipo de sueldo, otros descuentos, asignación familiar, ¿ya pagaron el último mes trabajado?",
      depende: [] },
    { id: "in_cotizaciones_al_dia", tipo: "entrada", titulo: "Cotizaciones al día",
      formula: "¿El empleador tenía las cotizaciones (AFP, salud, AFC) al día en la fecha del despido?",
      depende: [] },

    // ── Tiempos y remuneración imponible ────────────────────────────────
    { id: "calc_tiempos", tipo: "calculo", titulo: "Tiempos trabajados",
      formula: "Meses completos + días residuales entre inicio y término, ambos extremos incluidos. Aritmética calendario exacta en UTC (evita overflow de fin de mes).",
      fuente: "lib/calculos/conteo.ts — contarDiasYMeses", depende: ["in_fechas"] },

    { id: "calc_tope_grat", tipo: "calculo", titulo: "Tope de gratificación mensual",
      formula: "tope = IMM vigente a la fecha de término × 4,75 / 12 (Art. 50 CT)",
      valores: [`IMM vigente: ${fmt(immVigente(hoy))}`, `Tope gratificación: ${fmt(topeGratificacionMensual(hoy))}/mes`],
      fuente: "lib/calculos/jornada.ts — topeGratificacionMensual", depende: ["in_fechas"] },

    { id: "calc_imponible", tipo: "calculo", titulo: "Gratificación e imponible total",
      formula: "Gratificación: si el monto fijo ingresado > 0 → se usa ese monto; si no → min(sueldoBase × 25%, tope legal).\nImponible total = sueldoBase + gratificación.",
      fuente: "lib/calculos/cotizaciones.ts — calcularGratificacionMensual",
      depende: ["in_remuneracion", "calc_tope_grat"] },

    { id: "calc_valor_dia", tipo: "calculo", titulo: "Valor día",
      formula: "imponibleTotal / 30 (divisor legal)", fuente: "lib/calculos/remuneracion.ts — valorDia",
      depende: ["calc_imponible"] },

    { id: "calc_descuentos_prev", tipo: "calculo", titulo: "Descuentos previsionales",
      formula: "AFP: imponible × tasa vigente\nSalud: Fonasa 7% (2,8% con caja de compensación) o monto Isapre pactado\nAFC trabajador: 0,6% solo si el contrato es indefinido",
      valores: [
        ...AFPS.map((a) => `AFP ${a}: ${pct(tasaAfpVigente(a, hoy))}`),
        `Fonasa: ${pct(TASA_FONASA)} (${pct(TASA_FONASA_CON_CAJA)} con caja)`,
        `AFC trabajador (indefinido): ${pct(TASA_AFC_TRABAJADOR_INDEFINIDO)}`,
      ],
      fuente: "lib/calculos/cotizaciones.ts — calcularDescuentos + vigencias.ts",
      depende: ["calc_imponible", "in_prevision", "in_contrato"] },

    { id: "calc_rem_ultimos_dias", tipo: "decision", titulo: "Remuneración últimos días",
      formula: "Si ya pagaron el último mes → $0.\nSi no → (imponible / días del mes) × días trabajados ese mes, menos AFP/salud/AFC de ese monto proporcional.",
      fuente: "lib/calculos/remuneracion.ts — calcularRemuneracionUltimosDias",
      depende: ["calc_imponible", "calc_descuentos_prev", "in_descuentos"] },

    // ── Feriado proporcional (fusionado en un solo nodo) ────────────────
    { id: "calc_feriado", tipo: "calculo", titulo: "Feriado proporcional",
      formula: "días calculados = meses×(díasVacAnuales/12) + díasResiduales×(factorMensual/30), truncado a 2 decimales.\ndías a pagar = max(0, calculados − min(díasYaTomados, calculados)).\ndías corridos = proyecta los días hábiles al calendario desde el día siguiente al término (incluye sáb/dom).\nmonto = valorDía × (días corridos + fracción).",
      fuente: "lib/calculos/vacaciones.ts — calcularFeriado + proyectarEnCalendario",
      depende: ["calc_tiempos", "in_vacaciones", "in_fechas", "calc_valor_dia"] },

    // ── Indemnización / causales ────────────────────────────────────────
    { id: "calc_rem_base_indem", tipo: "calculo", titulo: "Remuneración base para indemnización",
      formula: "imponibleTotal + movilización + colación (Art. 172 CT: incluye beneficios no imponibles)",
      depende: ["calc_imponible", "in_remuneracion"] },

    { id: "dec_derecho_indem", tipo: "decision", titulo: "¿Tiene derecho a indemnización?",
      formula: "161_1 (necesidades de la empresa) y autodespido_* (Art. 171) → siempre.\n159_2 (renuncia) / 159_5 (conclusión de obra) → nunca.\n159_4 / 160_x (despido con causa) → solo si la causal se invocó incorrectamente (causalEsCorrecta = false).",
      nota: "Corrige un bug del motor original: antes se sumaba la indemnización sin importar la causal, incluso en renuncias.",
      fuente: "lib/calculos/causales.ts — tieneDerechoIndemnizacion", depende: ["in_causal"] },

    { id: "calc_indem_anos", tipo: "total", titulo: "Indemnización años de servicio",
      formula: "años = floor(meses/12) + (resto ≥ 6 ? 1 : 0), tope 11 años.\nmontoPorAño = min(remuneraciónBase, 90 × UF vigente).\ntotal = años (con tope) × montoPorAño.",
      valores: [`UF vigente: ${fmt(ufVigente(hoy))}`, `Tope 90 UF: ${fmt(90 * ufVigente(hoy))} por año`],
      fuente: "lib/calculos/indemnizacion.ts", depende: ["dec_derecho_indem", "calc_tiempos", "calc_rem_base_indem"] },

    { id: "dec_mes_aviso", tipo: "decision", titulo: "Mes de aviso sustitutivo",
      formula: "161_1: si no recibió carta con 30 días de anticipación → 1 mes de remuneración base.\nautodespido_* (Art. 171): siempre 1 mes (el empleador nunca dio aviso en este escenario).\nEn cualquier otro caso → $0.",
      fuente: "lib/calculos/causales.ts — calcularMesAvisoSustitutivo",
      depende: ["in_causal", "dec_derecho_indem", "calc_rem_base_indem"] },

    { id: "dec_recargo", tipo: "decision", titulo: "Recargo Art. 168",
      formula: "159_4: 50% si la causal se invocó incorrectamente.\n160_1a/160_5/160_6: 100% si hay pruebas de despido injustificado.\n160_1b/160_3/160_4/160_7: 80% en la misma condición.\n161_1: 30% fijo.\nautodespido_160_1 / autodespido_160_5 (Art. 171): 80% fijo.\nautodespido_160_7: 50% fijo.\nSiempre 0% si no corresponde indemnización.",
      nota: "Los porcentajes de autodespido vienen de fuentes públicas (no el texto literal del Art. 171) — confirmar con un abogado.",
      fuente: "lib/calculos/causales.ts — calcularRecargoArt168", depende: ["in_causal", "calc_indem_anos"] },

    { id: "dec_afc_empleador", tipo: "decision", titulo: "AFC empleador pendiente",
      formula: "Solo causal 161_1: imponibleTotal × tasa, menos lo ya descontado en el finiquito firmado.",
      valores: [`AFC empleador (indefinido): ${pct(TASA_AFC_EMPLEADOR_INDEFINIDO)}`, `AFC empleador (plazo/obra): ${pct(TASA_AFC_EMPLEADOR_PLAZO_OBRA)}`],
      fuente: "lib/calculos/causales.ts — calcularAfcEmpleador", depende: ["in_causal", "calc_imponible", "in_contrato"] },

    // ── Nulidad ─────────────────────────────────────────────────────────
    { id: "calc_nulidad", tipo: "decision", titulo: "Nulidad del despido",
      formula: "Si las cotizaciones estaban al día → $0, sin importar la fecha de consulta.\nSi no estaban al día: días = desde el día siguiente al despido hasta la fecha de consulta (ambos extremos incluidos); monto = valorDía × días.",
      nota: "Antes de julio 2026 este cálculo se hacía siempre, sin verificar si realmente había irregularidad — se corrigió para exigir la respuesta del usuario.",
      fuente: "lib/calculos/nulidad.ts", depende: ["in_fechas", "calc_valor_dia", "in_cotizaciones_al_dia"] },

    // ── Horas extra (fusionado) ──────────────────────────────────────────
    { id: "calc_horas_extra", tipo: "calculo", titulo: "Horas extra",
      formula: "valorHoraExtra = (imponibleTotal / 30) × (7 / jornadaSemanal) × 1,5 (Art. 32 CT — paramétrico según jornada legal vigente, Ley 21.561).\nmonto = valorHoraExtra × (horas + minutos/60).",
      depende: ["calc_imponible", "in_jornada"] },

    // ── Impuesto (fusionado) ──────────────────────────────────────────────
    { id: "calc_impuesto", tipo: "decision", titulo: "Impuesto único 2ª categoría",
      formula: "base tributable = imponibleTotal − descuentoAFP − descuentoSalud (el AFC no se resta de la base).\nExento si base / UTM ≤ 13,5.\nSi tributa: tabla progresiva por tramos de UTM → impuesto = base×tasa − deducción×UTM.",
      valores: [
        `UTM vigente: ${fmt(utmVigente(hoy))}`,
        ...TRAMOS_IMPUESTO.map((t, i) =>
          `Tramo ${i + 1}: hasta ${t.limiteUTM === Infinity ? "∞" : t.limiteUTM} UTM → ${pct(t.tasa)} (deduce ${t.deduccionUTM} UTM)`
        ),
      ],
      fuente: "lib/calculos/impuesto.ts", depende: ["calc_imponible", "calc_descuentos_prev"] },

    // ── Totales ─────────────────────────────────────────────────────────
    { id: "total_bruto", tipo: "total", titulo: "Total bruto",
      formula: "remuneración últimos días + feriado proporcional + mes de aviso + indemnización años de servicio + horas extra + asignación familiar + recargo Art. 168 + AFC empleador",
      depende: ["calc_rem_ultimos_dias", "calc_feriado", "dec_mes_aviso", "calc_indem_anos", "calc_horas_extra", "in_descuentos", "dec_recargo", "dec_afc_empleador"] },

    { id: "total_liquido", tipo: "total", titulo: "Total líquido",
      formula: "totalBruto − anticipo de sueldo − otros descuentos − impuesto único (si tributa)",
      depende: ["total_bruto", "calc_impuesto"] },

    { id: "total_final", tipo: "total", titulo: "Total con nulidad",
      formula: "totalLíquido + monto de nulidad del despido — lo que el trabajador podría demandar hoy.",
      depende: ["total_liquido", "calc_nulidad"] },
  ];
}

function calcularCapas(nodos: Omit<NodoArbol, "posicion">[]): Map<string, number> {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const capas = new Map<string, number>();

  function capaDe(id: string): number {
    if (capas.has(id)) return capas.get(id)!;
    const nodo = porId.get(id);
    if (!nodo || nodo.depende.length === 0) {
      capas.set(id, 0);
      return 0;
    }
    const capa = 1 + Math.max(...nodo.depende.map((d) => capaDe(d)));
    capas.set(id, capa);
    return capa;
  }

  nodos.forEach((n) => capaDe(n.id));
  return capas;
}

const COLUMNA_ANCHO = 420;
const GAP_VERTICAL = 36;

// Estimación de la altura real que va a ocupar la tarjeta en pantalla, según su
// contenido (título, fórmula, valores vigentes, nota, fuente). No es una medición
// exacta del DOM — es una heurística basada en caracteres por línea a un ancho de
// tarjeta de 300px — pero evita que las tarjetas con más texto (ej. autodespido,
// tramos de impuesto) se superpongan con la de abajo, sin depender de una librería
// de auto-layout.
const CARD_CHARS_POR_LINEA = 42;
const ALTO_LINEA = 16;
const ALTO_HEADER = 48;
const PADDING_BLOQUE = 16;
const ALTO_FUENTE = 28;

function contarFilas(texto: string): number {
  return texto
    .split("\n")
    .reduce((acc, linea) => acc + Math.max(1, Math.ceil(linea.length / CARD_CHARS_POR_LINEA)), 0);
}

function estimarAltura(nodo: Omit<NodoArbol, "posicion">): number {
  let altura = ALTO_HEADER;
  if (nodo.formula) altura += PADDING_BLOQUE + contarFilas(nodo.formula) * ALTO_LINEA;
  if (nodo.valores && nodo.valores.length > 0) altura += PADDING_BLOQUE + nodo.valores.length * ALTO_LINEA;
  if (nodo.nota) altura += PADDING_BLOQUE + contarFilas(nodo.nota) * ALTO_LINEA;
  if (nodo.fuente) altura += ALTO_FUENTE;
  return altura;
}

export function construirArbolFiniquito(
  hoy: string = new Date().toISOString().split("T")[0]
): { nodes: (NodoArbol & { x: number; y: number })[]; edges: EdgeArbol[] } {
  const definiciones = definirNodos(hoy);
  const porId = new Map(definiciones.map((n) => [n.id, n]));
  const capas = calcularCapas(definiciones);

  const nodosPorCapa = new Map<number, string[]>();
  definiciones.forEach((n) => {
    const capa = capas.get(n.id)!;
    const lista = nodosPorCapa.get(capa) ?? [];
    lista.push(n.id);
    nodosPorCapa.set(capa, lista);
  });

  const nodes = definiciones.map((n) => {
    const capa = capas.get(n.id)!;
    const listaCapa = nodosPorCapa.get(capa)!;
    const indice = listaCapa.indexOf(n.id);
    const alturas = listaCapa.map((id) => estimarAltura(porId.get(id)!));
    const alturaAcumulada = alturas.slice(0, indice).reduce((acc, h) => acc + h + GAP_VERTICAL, 0);
    const alturaTotalCapa = alturas.reduce((acc, h) => acc + h, 0) + GAP_VERTICAL * (alturas.length - 1);
    return {
      ...n,
      x: capa * COLUMNA_ANCHO,
      y: alturaAcumulada - alturaTotalCapa / 2,
    };
  });

  const edges: EdgeArbol[] = definiciones.flatMap((n) =>
    n.depende.map((d) => ({ id: `${d}->${n.id}`, source: d, target: n.id }))
  );

  return { nodes, edges };
}
