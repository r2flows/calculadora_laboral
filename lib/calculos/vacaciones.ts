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
export function proyectarEnCalendario(
  diasHabiles: number,
  fechaTermino: Date
): number {
  const inicio = new Date(fechaTermino);
  inicio.setDate(inicio.getDate() + 1); // día siguiente al término

  let habilesRestantes = diasHabiles;
  let diasCorridos = 0;
  const cursor = new Date(inicio);

  while (habilesRestantes > 0) {
    const diaSemana = cursor.getDay(); // 0=dom, 6=sáb
    if (diaSemana !== 0 && diaSemana !== 6) {
      habilesRestantes--;
    }
    diasCorridos++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return diasCorridos;
}
