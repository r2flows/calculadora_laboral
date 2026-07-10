import type { CausalDespidoV2, ContratoTipo } from "./tipos";
import {
  TASA_AFC_EMPLEADOR_INDEFINIDO,
  TASA_AFC_EMPLEADOR_PLAZO_OBRA,
} from "./vigencias";

export interface MetaCausal {
  label: string;
}

/** Metadata legal por causal — solo para mostrar en UI (ver funciones más abajo para reglas). */
export const CAUSALES_V2: Record<CausalDespidoV2, MetaCausal> = {
  "159_2": { label: "Renuncia voluntaria" },
  "159_4": { label: "Vencimiento del plazo convenido" },
  "159_5": { label: "Conclusión del trabajo, obra o faena" },
  "160_1a": { label: "Conducta indebida de carácter grave" },
  "160_1b": { label: "Conducta indebida no grave" },
  "160_3": { label: "Inasistencias injustificadas" },
  "160_4": { label: "Abandono del trabajo" },
  "160_5": { label: "Daño material intencional" },
  "160_6": { label: "Injuria grave al empleador o su familia" },
  "160_7": { label: "Incumplimiento grave de obligaciones del contrato" },
  "161_1": { label: "Necesidades de la empresa" },
  "autodespido_160_1": { label: "Autodespido — falta de probidad/conducta indebida grave del empleador" },
  "autodespido_160_5": { label: "Autodespido — imprudencia del empleador que afecta seguridad/salud" },
  "autodespido_160_7": { label: "Autodespido — incumplimiento grave del contrato por el empleador" },
};

/** ¿La causal es autodespido/despido indirecto (Art. 171)? */
export function esAutodespido(causal: CausalDespidoV2): boolean {
  return causal.startsWith("autodespido_");
}

/**
 * ¿Corresponde indemnización por años de servicio + aviso previo para este caso?
 *  - 161_1 (necesidades de la empresa) y autodespido_* (Art. 171 — el trabajador termina
 *    el contrato por una falta grave del empleador): siempre — el trabajador tiene los
 *    mismos derechos que en un despido injustificado.
 *  - 159_2 (renuncia) y 159_5 (conclusión de obra/faena): nunca — son términos naturales
 *    del contrato, no despidos.
 *  - 159_4 (vencimiento de plazo) y 160_x (despido con causa): solo si `causalEsCorrecta`
 *    es false, es decir, si el empleador NO invocó correctamente la causal (p. ej. el
 *    contrato en realidad era indefinido, o no hubo falta grave real) — en ese caso se
 *    trata como un despido injustificado.
 */
export function tieneDerechoIndemnizacion(causal: CausalDespidoV2, causalEsCorrecta: boolean): boolean {
  if (causal === "161_1" || esAutodespido(causal)) return true;
  if (causal === "159_2" || causal === "159_5") return false;
  return !causalEsCorrecta;
}

/**
 * Recargo Art. 168 sobre la indemnización por años de servicio, cuando el despido
 * resulta injustificado. Puerto directo de `getRecargoPct` en
 * aplicacion_abogados/utils/calculations-v2.ts:
 *  - 159_4: 50% si la causal se invocó incorrectamente (`causalEsCorrecta=false`).
 *  - 160_1a/160_5/160_6: 100% si el trabajador cuenta con pruebas/antecedentes de que
 *    el despido fue injustificado (`tienePruebas=true`).
 *  - 160_1b/160_3/160_4/160_7: 80% en las mismas condiciones.
 *  - 161_1: 30% fijo (Art. 168 letra a).
 *  - autodespido_160_1 / autodespido_160_5 (Art. 171, falta grave del empleador acogida
 *    por el N°1 o N°5 del Art. 160): 80% fijo, según fuentes públicas consultadas
 *    (loquetedeben.cl / derechopedia.cl, búsqueda 2026-07-04) — confirmar con un
 *    abogado el texto exacto del Art. 171 antes de exigir este monto.
 *  - autodespido_160_7 (incumplimiento grave acogido por el N°7): 50% fijo, misma fuente.
 * `tienePruebas` = el TRABAJADOR cuenta con antecedentes que acreditan que el despido
 * fue injustificado (no se refiere a que el empleador tenga pruebas de la causal). Para
 * autodespido, el recargo es fijo por causal, no depende de `tienePruebas`/`causalEsCorrecta`
 * (esos campos no se le preguntan al usuario para estas causales).
 * Si no corresponde indemnización (`indemnizacionAnosServicio=0`), el recargo es 0
 * automáticamente, ya que se calcula como porcentaje de esa base.
 */
export function calcularRecargoArt168(
  causal: CausalDespidoV2,
  causalEsCorrecta: boolean,
  tienePruebas: boolean,
  indemnizacionAnosServicio: number
): { porcentaje: number; monto: number } {
  if (indemnizacionAnosServicio <= 0) return { porcentaje: 0, monto: 0 };

  let porcentaje = 0;
  switch (causal) {
    case "159_4": porcentaje = causalEsCorrecta ? 0 : 50; break;
    case "160_1a": porcentaje = tienePruebas ? 100 : 0; break;
    case "160_1b": porcentaje = tienePruebas ? 80 : 0; break;
    case "160_3": porcentaje = tienePruebas ? 80 : 0; break;
    case "160_4": porcentaje = tienePruebas ? 80 : 0; break;
    case "160_5": porcentaje = tienePruebas ? 100 : 0; break;
    case "160_6": porcentaje = tienePruebas ? 100 : 0; break;
    case "160_7": porcentaje = tienePruebas ? 80 : 0; break;
    case "161_1": porcentaje = 30; break;
    case "autodespido_160_1": porcentaje = 80; break;
    case "autodespido_160_5": porcentaje = 80; break;
    case "autodespido_160_7": porcentaje = 50; break;
    default: porcentaje = 0;
  }

  return { porcentaje, monto: Math.round((indemnizacionAnosServicio * porcentaje) / 100) };
}

/**
 * Explica, de forma legalmente precisa, por qué corresponde (o no) el recargo Art. 168
 * — para uso exclusivo del panel admin/abogado (nunca se muestra al cliente sin
 * revisión legal, ya que es una conclusión jurídica, no un hecho). Cita la causal, el
 * artículo/letra exacta, el dato declarado por el usuario que gatilla la regla, y el
 * monto resultante — evita alertas ambiguas tipo "podría ser incorrecta" sin fundamento.
 */
export function explicarRecargoArt168(
  causal: CausalDespidoV2,
  causalEsCorrecta: boolean,
  tienePruebas: boolean,
  porcentaje: number,
  monto: number
): string | null {
  if (porcentaje <= 0) return null;

  const base = CAUSALES_V2[causal].label;
  switch (causal) {
    case "159_4":
      return `Causal ${causal} (${base}): el usuario declaró que el contrato NO venció correctamente en la fecha indicada → se trata como despido injustificado, recargo Art. 168 letra b) de ${porcentaje}% = $${monto.toLocaleString("es-CL")} sobre la indemnización.`;
    case "160_1a":
    case "160_1b":
    case "160_3":
    case "160_4":
    case "160_5":
    case "160_6":
    case "160_7":
      return `Causal ${causal} (${base}): el usuario declaró contar con pruebas/antecedentes de que el despido fue injustificado → recargo Art. 168 de ${porcentaje}% = $${monto.toLocaleString("es-CL")} sobre la indemnización. Verificar las pruebas declaradas antes de exigir el recargo.`;
    case "161_1":
      return `Causal 161_1 (necesidades de la empresa): recargo fijo del 30% (Art. 168 letra a) = $${monto.toLocaleString("es-CL")} sobre la indemnización por años de servicio.`;
    case "autodespido_160_1":
    case "autodespido_160_5":
    case "autodespido_160_7":
      return `Autodespido (Art. 171) — el trabajador invocó ${base}: recargo fijo del ${porcentaje}% = $${monto.toLocaleString("es-CL")} sobre la indemnización. Requiere que el tribunal acoja la causal invocada — verificar antecedentes antes de exigir el monto.`;
    default:
      return null;
  }
}

/**
 * Mes de aviso sustitutivo:
 *  - 161_1 (Art. 162): 1 mes de remuneración cuando el empleador despide por
 *    necesidades de la empresa sin haber dado aviso con 30 días de anticipación.
 *  - autodespido_* (Art. 171): siempre corresponde — en un autodespido el empleador
 *    nunca dio aviso previo (es el trabajador quien termina el contrato por su falta),
 *    así que no depende de `recibioCarta30Dias`.
 */
export function calcularMesAvisoSustitutivo(
  causal: CausalDespidoV2,
  causalEsCorrecta: boolean,
  recibioCarta30Dias: boolean,
  remuneracionBase: number
): number {
  if (!tieneDerechoIndemnizacion(causal, causalEsCorrecta)) return 0;
  if (esAutodespido(causal)) return remuneracionBase;
  if (causal !== "161_1") return 0;
  return recibioCarta30Dias ? 0 : remuneracionBase;
}

/**
 * AFC que debía pagar el empleador (2,4% indefinido / 3% plazo fijo-obra) cuando el
 * despido es por 161_1, menos lo que ya conste descontado en el finiquito firmado.
 */
export function calcularAfcEmpleador(
  causal: CausalDespidoV2,
  causalEsCorrecta: boolean,
  imponibleTotal: number,
  contratoTipo: ContratoTipo,
  afcYaDescontado: number
): number {
  if (causal !== "161_1") return 0;
  if (!tieneDerechoIndemnizacion(causal, causalEsCorrecta)) return 0;
  const tasa = contratoTipo === "indefinido" ? TASA_AFC_EMPLEADOR_INDEFINIDO : TASA_AFC_EMPLEADOR_PLAZO_OBRA;
  const corresponde = Math.round(imponibleTotal * tasa);
  return Math.max(0, corresponde - (afcYaDescontado || 0));
}
