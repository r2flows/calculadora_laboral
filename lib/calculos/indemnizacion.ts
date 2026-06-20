import type { CausalDespido } from "./tipos";

/** Causales que dan derecho a indemnización por años de servicio. */
const CAUSALES_CON_INDEMNIZACION: CausalDespido[] = ["art161", "art161a", "autodespido"];

/** Causales que dan derecho a indemnización sustitutiva de aviso previo. */
const CAUSALES_CON_AVISO: CausalDespido[] = ["art161", "art161a"];

/**
 * Indemnización por años de servicio.
 * 1 mes de remuneración por cada año trabajado (fracción > 6 meses = 1 año).
 * Tope: 11 años.
 */
export function calcularIndemnizacionAnosServicio(
  meses: number,
  remuneracionBase: number,
  causal: CausalDespido
): number {
  if (!CAUSALES_CON_INDEMNIZACION.includes(causal)) return 0;

  const anosCompletos = Math.floor(meses / 12);
  const mesesResiduo = meses % 12;
  const anos = anosCompletos + (mesesResiduo >= 6 ? 1 : 0);
  const anosConTope = Math.min(anos, 11);

  return anosConTope * remuneracionBase;
}

/**
 * Indemnización sustitutiva de aviso previo (1 mes de remuneración).
 */
export function calcularAvisoPrevio(
  remuneracionBase: number,
  causal: CausalDespido
): number {
  if (!CAUSALES_CON_AVISO.includes(causal)) return 0;
  return remuneracionBase;
}
