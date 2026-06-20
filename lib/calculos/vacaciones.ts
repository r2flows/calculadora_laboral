/** Trunca a 2 decimales (no redondea). */
function truncar2(n: number): number {
  return Math.floor(n * 100) / 100;
}

/**
 * Calcula días hábiles de feriado proporcional.
 * Resultado truncado a 2 decimales.
 */
export function calcularFeriado(
  meses: number,
  dias: number,
  diasVacacionesAnuales: number
): number {
  const factorMensual = diasVacacionesAnuales / 12;
  const factorDiario = factorMensual / 30;
  const resultado = meses * factorMensual + dias * factorDiario;
  return truncar2(resultado);
}

/**
 * Proyecta días hábiles de feriado en el calendario desde el día siguiente
 * al término del contrato, contando todos los días (sáb, dom y festivos incluidos).
 * Retorna los días corridos que corresponde pagar.
 *
 * Nota: por simplicidad, esta función cuenta días hábiles laborales (lun-vie)
 * y los proyecta sobre el calendario para obtener días corridos totales.
 * Un cálculo exacto requeriría la lista de festivos chilenos del año correspondiente.
 */
/**
 * Proyecta días hábiles ENTEROS en el calendario desde el día siguiente
 * al término, contando sábados, domingos y feriados que quedan dentro
 * del período de vacaciones.
 * Recibe solo la parte entera de los días hábiles — la fracción se suma
 * directamente en calcularFiniquito para no inflar el conteo.
 */
export function proyectarEnCalendario(
  diasHabilesEnteros: number,
  fechaTermino: Date
): number {
  if (diasHabilesEnteros <= 0) return 0;

  // Usar UTC para evitar desfases de zona horaria en el servidor
  const cursor = new Date(Date.UTC(
    fechaTermino.getUTCFullYear(),
    fechaTermino.getUTCMonth(),
    fechaTermino.getUTCDate() + 1
  ));

  let habilesRestantes = diasHabilesEnteros;
  let diasCorridos = 0;

  while (habilesRestantes > 0) {
    const diaSemana = cursor.getUTCDay(); // 0=dom, 6=sáb
    if (diaSemana !== 0 && diaSemana !== 6) {
      habilesRestantes--;
    }
    diasCorridos++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return diasCorridos;
}
