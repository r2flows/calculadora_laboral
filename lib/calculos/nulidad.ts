/**
 * Días de nulidad del despido.
 * Desde el día siguiente al despido (inclusive) hasta la fecha de consulta (inclusive).
 * Usa UTC para evitar desfases de timezone.
 */
export function calcularDiasNulidad(fechaDespido: Date, fechaConsulta: Date): number {
  const inicio = new Date(Date.UTC(
    fechaDespido.getUTCFullYear(),
    fechaDespido.getUTCMonth(),
    fechaDespido.getUTCDate() + 1
  ));
  const fin = new Date(Date.UTC(
    fechaConsulta.getUTCFullYear(),
    fechaConsulta.getUTCMonth(),
    fechaConsulta.getUTCDate()
  ));

  if (fin < inicio) return 0;
  return Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
}
