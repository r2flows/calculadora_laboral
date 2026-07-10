import { utmVigente } from "./vigencias";

// Tabla impuesto segunda categoría mensual — tramos en UTM, deducción en UTM
// Fuente: SII Chile
export const TRAMOS_IMPUESTO: { limiteUTM: number; tasa: number; deduccionUTM: number }[] = [
  { limiteUTM: 13.5,  tasa: 0,      deduccionUTM: 0 },
  { limiteUTM: 30,    tasa: 0.04,   deduccionUTM: 0.54 },
  { limiteUTM: 50,    tasa: 0.08,   deduccionUTM: 1.74 },
  { limiteUTM: 70,    tasa: 0.135,  deduccionUTM: 4.49 },
  { limiteUTM: 90,    tasa: 0.23,   deduccionUTM: 11.14 },
  { limiteUTM: 120,   tasa: 0.304,  deduccionUTM: 17.80 },
  { limiteUTM: 150,   tasa: 0.35,   deduccionUTM: 23.32 },
  { limiteUTM: Infinity, tasa: 0.40, deduccionUTM: 30.82 },
];

/**
 * Impuesto único segunda categoría mensual.
 * Base imponible = remuneración bruta - AFP - salud (no AFC).
 * Los tramos se expresan en UTM; la deducción elimina el efecto de salto entre tramos.
 * `fecha` (ISO, por defecto hoy) determina la UTM vigente (ver lib/calculos/vigencias.ts).
 */
export function calcularImpuestoRenta(
  baseImponible: number,
  fecha: string = new Date().toISOString().split("T")[0]
): number {
  const utm = utmVigente(fecha);
  const baseUTM = baseImponible / utm;

  const tramo = TRAMOS_IMPUESTO.find((t) => baseUTM <= t.limiteUTM);
  if (!tramo || tramo.tasa === 0) return 0;

  const impuesto = baseImponible * tramo.tasa - tramo.deduccionUTM * utm;
  return Math.max(0, Math.round(impuesto));
}

export function tributaImpuesto(
  baseImponible: number,
  fecha: string = new Date().toISOString().split("T")[0]
): boolean {
  return baseImponible / utmVigente(fecha) > 13.5;
}
