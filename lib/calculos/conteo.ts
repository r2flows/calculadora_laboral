/**
 * Cuenta meses completos y días residuales entre dos fechas (ambos extremos incluidos).
 *
 * Algoritmo: compara year/month/day en UTC para evitar desfases de timezone.
 * NO usa setUTCMonth() para evitar overflow en días de fin de mes (ej. ene-31 + 1 mes ≠ mar-3).
 *
 * Corrección documentada: el día del despido (fechaFin) debe estar incluido.
 */
export function contarDiasYMeses(
  inicio: Date,
  fin: Date
): { meses: number; dias: number; totalDias: number } {
  const iy = inicio.getUTCFullYear(), im = inicio.getUTCMonth(), id = inicio.getUTCDate();
  const fy = fin.getUTCFullYear(), fm = fin.getUTCMonth(), fd = fin.getUTCDate();

  // Meses completos transcurridos
  let meses = (fy - iy) * 12 + (fm - im);

  // Si el día del fin es anterior al día de inicio, el último mes no está completo
  if (fd < id) meses--;
  if (meses < 0) meses = 0;

  // Cursor: mismo día-del-mes que inicio, "meses" meses después
  const cursorAnio = iy + Math.floor((im + meses) / 12);
  const cursorMes = (im + meses) % 12;

  const cursorDate = new Date(Date.UTC(cursorAnio, cursorMes, id));
  const finDate   = new Date(Date.UTC(fy, fm, fd));
  const inicioDate = new Date(Date.UTC(iy, im, id));

  // Días residuales: desde cursor hasta fin, ambos incluidos
  const dias = Math.max(0, Math.round((finDate.getTime() - cursorDate.getTime()) / 86400000) + 1);
  const totalDias = Math.round((finDate.getTime() - inicioDate.getTime()) / 86400000) + 1;

  return { meses, dias, totalDias };
}

/**
 * Días del mes en curso al momento del despido.
 * Desde el día 1 del mes hasta el día del despido, ambos incluidos.
 */
export function diasMesEnCurso(fechaDespido: Date): number {
  const fy = fechaDespido.getUTCFullYear();
  const fm = fechaDespido.getUTCMonth();
  const fd = fechaDespido.getUTCDate();
  const inicio = new Date(Date.UTC(fy, fm, 1));
  const fin    = new Date(Date.UTC(fy, fm, fd));
  return Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
}

/** Días del mes calendario del despido. */
export function diasEnMes(fecha: Date): number {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)).getUTCDate();
}
