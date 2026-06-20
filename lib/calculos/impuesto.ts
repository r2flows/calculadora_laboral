// UTM vigente 2025 (se actualiza mensualmente; valor referencial)
const UTM = 67_294;

// Tabla impuesto segunda categoría mensual — tramos en UTM, deducción en UTM
// Fuente: SII Chile 2025
const TRAMOS: { limiteUTM: number; tasa: number; deduccionUTM: number }[] = [
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
 */
export function calcularImpuestoRenta(baseImponible: number): number {
  const baseUTM = baseImponible / UTM;

  const tramo = TRAMOS.find((t) => baseUTM <= t.limiteUTM);
  if (!tramo || tramo.tasa === 0) return 0;

  const impuesto = baseImponible * tramo.tasa - tramo.deduccionUTM * UTM;
  return Math.max(0, Math.round(impuesto));
}

export function tributaImpuesto(baseImponible: number): boolean {
  return baseImponible / UTM > 13.5;
}
