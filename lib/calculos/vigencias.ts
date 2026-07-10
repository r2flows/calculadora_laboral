import type { AFP } from "./tipos";

/**
 * Tablas de vigencia de constantes legales — UTM, UF, tasas AFP, asignación familiar.
 * Mismo patrón que TABLA_JORNADA_MAXIMA/TABLA_IMM en jornada.ts: ordenadas de más
 * reciente a más antigua; se toma la primera entrada cuya fecha "desde" es ≤ la
 * fecha consultada (comparación de strings ISO YYYY-MM-DD, orden lexicográfico).
 *
 * Última verificación en vivo: 2026-07-04 (búsqueda web, ver casos-limite-legales.md
 * ítem 4). Fuentes: sii.cl (UTM), valoruf.cl/BCentral (UF), Superintendencia de
 * Pensiones vía comparadores de comisión (AFP), SUSESO/Chileatiende (asignación
 * familiar). Los comparadores de AFP solo publican la comisión variable — la tasa
 * total trabajador = 10% (cotización obligatoria) + comisión.
 *
 * TODO: automatizar UTM/UF contra una fuente oficial en vivo en vez de hardcodear —
 * la UF cambia a diario, así que el valor de hoy queda desactualizado mañana. UTM/IMM/
 * asignación familiar cambian con menor frecuencia (mensual/anual) y son más seguros
 * de mantener a mano, pero igual requieren revisión periódica.
 */

const TABLA_UTM: { desde: string; valor: number }[] = [
  { desde: "2026-07-01", valor: 71_649 }, // sii.cl, confirmado por búsqueda 2026-07-04
  { desde: "2025-01-01", valor: 68_306 },
  { desde: "2024-01-01", valor: 65_171 },
  { desde: "2023-01-01", valor: 62_630 },
  { desde: "2022-01-01", valor: 57_491 },
  { desde: "1900-01-01", valor: 67_294 }, // fallback histórico
];

export function utmVigente(fecha: string): number {
  const entrada = TABLA_UTM.find((t) => fecha >= t.desde);
  return entrada?.valor ?? 71_649;
}

// La UF cambia a diario — este valor es una foto del 2026-07-04 ($40.831,19, valoruf.cl).
// Para cálculos exactos en fechas distintas, reemplazar por una consulta en vivo.
const TABLA_UF: { desde: string; valor: number }[] = [
  { desde: "2026-07-04", valor: 40_831 },
  { desde: "2025-01-01", valor: 38_500 },
  { desde: "2024-05-01", valor: 37_500 },
  { desde: "1900-01-01", valor: 37_500 },
];

export function ufVigente(fecha: string): number {
  const entrada = TABLA_UF.find((t) => fecha >= t.desde);
  return entrada?.valor ?? 40_831;
}

interface TablaAfpEntry {
  desde: string;
  tasas: Record<AFP, number>;
}

// Tasas trabajador (excluye SIS) = 10% cotización obligatoria + comisión variable.
// Confirmado por búsqueda web 2026-07-04: Capital y Uno estaban desactualizadas (ver
// casos-limite-legales.md ítem 4) — Capital pasó a coincidir con Cuprum (1,44% comisión),
// y Uno bajó su comisión a 0,46% desde el 1-may-2026 (antes 0,49%, y antes de eso 0,69%).
const TABLA_TASAS_AFP: TablaAfpEntry[] = [
  {
    desde: "2026-05-01",
    tasas: {
      Capital: 0.1144,
      Cuprum: 0.1144,
      Habitat: 0.1127,
      Modelo: 0.1058,
      PlanVital: 0.1116,
      Provida: 0.1145,
      Uno: 0.1046,
    },
  },
  {
    desde: "1900-01-01", // fallback histórico (valores previos a la reconciliación)
    tasas: {
      Capital: 0.1127,
      Cuprum: 0.1144,
      Habitat: 0.1127,
      Modelo: 0.1058,
      PlanVital: 0.1116,
      Provida: 0.1145,
      Uno: 0.1069,
    },
  },
];

export function tasaAfpVigente(afp: AFP, fecha: string): number {
  const entrada =
    TABLA_TASAS_AFP.find((t) => fecha >= t.desde) ?? TABLA_TASAS_AFP[TABLA_TASAS_AFP.length - 1];
  return entrada.tasas[afp];
}

export const TASA_FONASA = 0.07;
export const TASA_FONASA_CON_CAJA = 0.028; // Fonasa reducida cuando hay caja de compensación
export const TASA_AFC_TRABAJADOR_INDEFINIDO = 0.006;
export const TASA_AFC_EMPLEADOR_INDEFINIDO = 0.024;
export const TASA_AFC_EMPLEADOR_PLAZO_OBRA = 0.03;

interface TablaAsigFamiliarEntry {
  desde: string;
  tramos: { montoMaximo: number; montoAsignacion: number }[];
}

const TABLA_ASIGNACION_FAMILIAR: TablaAsigFamiliarEntry[] = [
  {
    desde: "2026-01-01", // confirmado por SUSESO/Chileatiende, búsqueda 2026-07-04.
    // Nota: la ley reajusta estos tramos cada 1° de julio — no se encontró con certeza
    // un nuevo tramo vigente desde jul-2026 en la búsqueda (fuentes contradictorias);
    // confirmar con SUSESO si ya hay un reajuste de julio-2026 no reflejado aquí.
    tramos: [
      { montoMaximo: 631_976, montoAsignacion: 22_007 },
      { montoMaximo: 923_067, montoAsignacion: 13_505 },
      { montoMaximo: 1_439_668, montoAsignacion: 4_267 },
      { montoMaximo: Infinity, montoAsignacion: 0 },
    ],
  },
  {
    desde: "2025-07-01", // fuente: aplicacion_abogados, etiquetada "vigente 2025"
    tramos: [
      { montoMaximo: 383_846, montoAsignacion: 18_317 },
      { montoMaximo: 598_012, montoAsignacion: 11_272 },
      { montoMaximo: 835_688, montoAsignacion: 3_556 },
      { montoMaximo: Infinity, montoAsignacion: 0 },
    ],
  },
  {
    desde: "1900-01-01", // fuente: calculadora_laboral, etiquetada "vigente 2024" (fallback histórico)
    tramos: [
      { montoMaximo: 390_255, montoAsignacion: 16_899 },
      { montoMaximo: 569_646, montoAsignacion: 10_368 },
      { montoMaximo: 882_589, montoAsignacion: 3_276 },
      { montoMaximo: Infinity, montoAsignacion: 0 },
    ],
  },
];

function tramoAsignacionFamiliar(
  sueldoBruto: number,
  fecha: string
): { montoMaximo: number; montoAsignacion: number } {
  const entrada =
    TABLA_ASIGNACION_FAMILIAR.find((t) => fecha >= t.desde) ??
    TABLA_ASIGNACION_FAMILIAR[TABLA_ASIGNACION_FAMILIAR.length - 1];
  return (
    entrada.tramos.find((tr) => sueldoBruto <= tr.montoMaximo) ??
    entrada.tramos[entrada.tramos.length - 1]
  );
}

export function calcularAsignacionFamiliarVigente(
  sueldoBruto: number,
  cargas: number,
  fecha: string
): number {
  return tramoAsignacionFamiliar(sueldoBruto, fecha).montoAsignacion * cargas;
}
