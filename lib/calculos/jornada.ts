/**
 * Tablas de vigencia de jornada máxima legal e IMM — Chile.
 *
 * Ley 21.561 (Diario Oficial 26-04-2023): reducción gradual de jornada.
 * IMM: actualizar con cada decreto anual (normalmente mayo de cada año).
 *
 * Tablas ordenadas de más reciente a más antigua — se toma la primera
 * entrada cuya fecha "desde" es ≤ a la fecha consultada.
 */

const TABLA_JORNADA_MAXIMA: { desde: string; horas: number }[] = [
  { desde: "2028-04-26", horas: 40 }, // Etapa 4 — final
  { desde: "2026-04-26", horas: 42 }, // Etapa 3 — vigente jun 2026
  { desde: "2024-04-26", horas: 44 }, // Etapa 2
  { desde: "1900-01-01", horas: 45 }, // Antes de Ley 21.561
];

const TABLA_IMM: { desde: string; monto: number }[] = [
  { desde: "2026-05-01", monto: 553_553 }, // Ley 21.751 (retroactivo may-2026)
  { desde: "2026-01-01", monto: 539_000 }, // Incremento enero 2026
  { desde: "2025-01-01", monto: 510_000 }, // Incremento enero 2025
  { desde: "2024-05-01", monto: 460_000 }, // Incremento mayo 2024
  { desde: "2023-05-01", monto: 440_000 }, // Incremento mayo 2023
  { desde: "1900-01-01", monto: 350_000 }, // Fallback histórico
];

/**
 * Jornada máxima legal en horas semanales para una fecha de término.
 * Usa comparación de strings ISO (YYYY-MM-DD) — orden lexicográfico correcto.
 */
export function jornadaMaximaLegal(fechaTermino: string): number {
  const entrada = TABLA_JORNADA_MAXIMA.find((t) => fechaTermino >= t.desde);
  return entrada?.horas ?? 45;
}

/** IMM vigente en pesos para una fecha de término. */
export function immVigente(fechaTermino: string): number {
  const entrada = TABLA_IMM.find((t) => fechaTermino >= t.desde);
  return entrada?.monto ?? 510_000;
}

/**
 * Tope mensual de gratificación legal (Art. 50 CT): 4,75 IMM / 12.
 * Depende del IMM vigente a la fecha de término.
 */
export function topeGratificacionMensual(fechaTermino: string): number {
  return Math.round((immVigente(fechaTermino) * 4.75) / 12);
}

/**
 * Sueldo mínimo legal aplicable según jornada parcial.
 *  - ≤ 30 hrs/semana → proporcional: IMM × (horas / jornada_max)
 *  - > 30 hrs/semana (pero < jornada max) → IMM íntegro (norma DT)
 *  - Jornada completa → IMM íntegro
 */
export function minimoLegalAplicable(
  horasSemana: number,
  fechaTermino: string
): number {
  const imm = immVigente(fechaTermino);
  const jornadaMax = jornadaMaximaLegal(fechaTermino);

  if (horasSemana >= jornadaMax) return imm; // jornada completa
  if (horasSemana > 30) return imm;           // > 30 hrs pero parcial → íntegro
  return Math.round(imm * (horasSemana / jornadaMax)); // ≤ 30 hrs → proporcional
}
