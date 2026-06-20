import { contarDiasYMeses } from "./conteo";
import { calcularFeriado, proyectarEnCalendario } from "./vacaciones";
import { calcularDiasNulidad } from "./nulidad";
import { calcularIndemnizacionAnosServicio, calcularAvisoPrevio } from "./indemnizacion";
import { calcularRemuneracionUltimosDias, valorDia } from "./remuneracion";
import { calcularGratificacionMensual, calcularDescuentos } from "./cotizaciones";
import { topeGratificacionMensual } from "./jornada";
import { calcularImpuestoRenta, tributaImpuesto } from "./impuesto";
import type { DatosFiniquito, ResultadoFiniquito } from "./tipos";

export function calcularFiniquito(datos: DatosFiniquito): ResultadoFiniquito {
  const alertas: string[] = [];

  // 1. Tiempos trabajados
  const { meses: mesesTrabajados, dias: diasTrabajados } = contarDiasYMeses(
    datos.fechaInicio,
    datos.fechaTermino
  );

  // Fecha de término como string ISO para consultar tablas de vigencia
  const fechaTerminoISO = datos.fechaTermino instanceof Date
    ? datos.fechaTermino.toISOString().split("T")[0]
    : String(datos.fechaTermino);

  // 2. Gratificación mensual (imponible) — tope según IMM vigente a fecha de término
  const topeGratif = topeGratificacionMensual(fechaTerminoISO);
  const gratificacionMensual = datos.recibeGratificacion
    ? calcularGratificacionMensual(datos.sueldoBase, datos.gratificacionMensualFija, topeGratif)
    : 0;

  // Remuneración imponible total (base para cotizaciones, valor día e indemnizaciones)
  const remuneracionImponibleTotal = datos.sueldoBase + gratificacionMensual;

  // 3. Últimos días del mes (si no fueron pagados) — incluye gratificación proporcional
  let remUltimosDias = 0;
  let cotizacionesUltimosDias = { afp: 0, salud: 0, afc: 0, total: 0 };

  if (!datos.reciboRemuneracionUltimoMes) {
    const resultado = calcularRemuneracionUltimosDias(
      datos.fechaTermino,
      remuneracionImponibleTotal,
      datos.afp,
      datos.tipoSalud,
      datos.montoIsapre
    );
    remUltimosDias = resultado.montoLiquido;
    cotizacionesUltimosDias = resultado.cotizaciones;
  }

  // 4. Feriado proporcional (descontando días ya gozados)
  const feriadoProporcionalDiasCalculados = calcularFeriado(
    mesesTrabajados,
    diasTrabajados,
    datos.diasVacacionesAnuales
  );
  const feriadoProporcionalDiasDescontados = Math.min(
    datos.diasVacacionesTomados,
    feriadoProporcionalDiasCalculados
  );
  const feriadoProporcionalDias = Math.max(
    0,
    feriadoProporcionalDiasCalculados - feriadoProporcionalDiasDescontados
  );

  // Valor día se calcula sobre remuneración imponible total (sueldo + gratificación)
  const vDia = valorDia(remuneracionImponibleTotal);

  // Proyectar solo la parte entera a días corridos (sáb/dom incluidos entre días hábiles).
  // La fracción se añade directamente para no contar un día hábil de más.
  const diasHabilesEnteros = Math.floor(feriadoProporcionalDias);
  const fraccionHabiles = feriadoProporcionalDias - diasHabilesEnteros;
  const diasCorridos = proyectarEnCalendario(diasHabilesEnteros, datos.fechaTermino);
  const feriadoProporcionalMonto = Math.round(vDia * (diasCorridos + fraccionHabiles));

  // 5. Indemnizaciones — base incluye movilización y colación (art. 172 CT)
  const remuneracionBaseIndemnizacion =
    remuneracionImponibleTotal + datos.movilizacion + datos.colacion;
  const indemnizacionAvisoPrevio = calcularAvisoPrevio(remuneracionBaseIndemnizacion, datos.causal);
  const indemnizacionAnosServicio = calcularIndemnizacionAnosServicio(
    mesesTrabajados,
    remuneracionBaseIndemnizacion,
    datos.causal
  );

  // 6. Nulidad
  const diasNulidad = calcularDiasNulidad(datos.fechaTermino, datos.fechaConsulta);
  const montoNulidad = Math.round(vDia * diasNulidad);

  // 7. Horas/minutos extra permanentes
  const valorHoraExtra = Math.round((remuneracionImponibleTotal / 30 / 8) * 1.5);
  const montoHorasExtra =
    valorHoraExtra * datos.horasExtraPermanentes +
    Math.round((valorHoraExtra / 60) * datos.minutosExtraPermanentes);

  // 8. Impuesto segunda categoría
  // Base = remuneración imponible mensual − AFP − salud (no AFC, no asig. familiar)
  const cotizacionesBase = calcularDescuentos(
    remuneracionImponibleTotal,
    datos.afp,
    datos.tipoSalud,
    datos.montoIsapre
  );
  const baseImpuesto = remuneracionImponibleTotal - cotizacionesBase.afp - cotizacionesBase.salud;
  const impuestoRenta = calcularImpuestoRenta(baseImpuesto);
  const trabajadorTributa = tributaImpuesto(baseImpuesto);

  // 9. Totales
  const totalBruto =
    remUltimosDias +
    feriadoProporcionalMonto +
    indemnizacionAvisoPrevio +
    indemnizacionAnosServicio +
    montoHorasExtra +
    datos.asignacionFamiliar;

  const totalLiquido =
    totalBruto - datos.anticipoSueldo - datos.otrosDescuentos -
    (trabajadorTributa ? impuestoRenta : 0);
  const totalConNulidad = totalLiquido + montoNulidad;

  // 9. Alertas internas (admin)
  if (datos.movilizacion > 50000) {
    alertas.push("ALERTA: Movilización supera $50.000 — posible evasión de cotizaciones.");
  } else if (datos.movilizacion > 25000) {
    if (datos.viajaOtraRegion && datos.empresaPagaPasajes) {
      alertas.push("AVISO: Movilización >$25.000 con viaje a otra región pagado por empresa.");
    } else if (!datos.viajaOtraRegion) {
      alertas.push("AVISO: Movilización >$25.000 sin viaje a otra región — revisar cotizabilidad.");
    }
  }

  if (datos.colacion > 30000) {
    alertas.push("ALERTA: Colación supera $30.000 — posible evasión de cotizaciones.");
  }

  for (const bono of datos.otrosBonos) {
    if (!bono.esCotizable) {
      alertas.push(
        `ALERTA: Bono "${bono.nombre}" marcado como no cotizable — revisar evasión.`
      );
    }
  }

  return {
    mesesTrabajados,
    diasTrabajados,
    gratificacionMensual,
    remuneracionImponibleTotal,
    remUltimosDias,
    cotizacionesUltimosDias,
    feriadoProporcionalDiasCalculados,
    feriadoProporcionalDiasDescontados,
    feriadoProporcionalDias,
    feriadoProporcionalMonto,
    indemnizacionAvisoPrevio,
    indemnizacionAnosServicio,
    diasNulidad,
    montoNulidad,
    anticipoSueldo: datos.anticipoSueldo,
    otrosDescuentos: datos.otrosDescuentos,
    asignacionFamiliar: datos.asignacionFamiliar,
    tributaImpuesto: trabajadorTributa,
    baseImpuesto,
    impuestoRenta,
    totalBruto,
    totalLiquido,
    totalConNulidad,
    alertas,
  };
}
