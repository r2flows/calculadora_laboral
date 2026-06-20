import { contarDiasYMeses } from "./conteo";
import { calcularFeriado, proyectarEnCalendario } from "./vacaciones";
import { calcularDiasNulidad } from "./nulidad";
import { calcularIndemnizacionAnosServicio, calcularAvisoPrevio } from "./indemnizacion";
import { calcularRemuneracionUltimosDias, valorDia } from "./remuneracion";
import { calcularGratificacionMensual } from "./cotizaciones";
import { calcularImpuestoRenta, tributaImpuesto } from "./impuesto";
import type { DatosFiniquito, ResultadoFiniquito } from "./tipos";

export function calcularFiniquito(datos: DatosFiniquito): ResultadoFiniquito {
  const alertas: string[] = [];

  // 1. Tiempos trabajados
  const { meses: mesesTrabajados, dias: diasTrabajados } = contarDiasYMeses(
    datos.fechaInicio,
    datos.fechaTermino
  );

  // 2. Gratificación mensual (imponible)
  const gratificacionMensual = datos.recibeGratificacion
    ? calcularGratificacionMensual(datos.sueldoBase, datos.gratificacionMensualFija)
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
  const diasCorridos = proyectarEnCalendario(feriadoProporcionalDias, datos.fechaTermino);
  const feriadoProporcionalMonto = Math.round(vDia * diasCorridos);

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

  // 8. Impuesto segunda categoría (sobre remuneración imponible neta de cotizaciones)
  // Base = remuneración imponible - AFP - salud (no incluye AFC ni asignación familiar)
  // En el finiquito se aplica sobre los ítems tributables: últimos días + feriado
  const baseImpuesto = remuneracionImponibleTotal;
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
    impuestoRenta,
    totalBruto,
    totalLiquido,
    totalConNulidad,
    alertas,
  };
}
