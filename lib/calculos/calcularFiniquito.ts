import { contarDiasYMeses } from "./conteo";
import { calcularFeriado, proyectarEnCalendario } from "./vacaciones";
import { calcularDiasNulidad } from "./nulidad";
import { calcularIndemnizacionAnosServicio, calcularAvisoPrevio } from "./indemnizacion";
import { calcularRemuneracionUltimosDias } from "./remuneracion";
import { valorDia } from "./remuneracion";
import type { DatosFiniquito, ResultadoFiniquito } from "./tipos";

export function calcularFiniquito(datos: DatosFiniquito): ResultadoFiniquito {
  const alertas: string[] = [];

  // 1. Tiempos trabajados
  const { meses: mesesTrabajados, dias: diasTrabajados } = contarDiasYMeses(
    datos.fechaInicio,
    datos.fechaTermino
  );

  // 2. Últimos días del mes (si no fueron pagados)
  let remUltimosDias = 0;
  let cotizacionesUltimosDias = { afp: 0, salud: 0, afc: 0, total: 0 };

  if (!datos.reciboRemuneracionUltimoMes) {
    const resultado = calcularRemuneracionUltimosDias(
      datos.fechaTermino,
      datos.sueldoBase,
      datos.afp,
      datos.tipoSalud,
      datos.montoIsapre
    );
    remUltimosDias = resultado.montoLiquido;
    cotizacionesUltimosDias = resultado.cotizaciones;
  }

  // 3. Feriado proporcional
  const feriadoProporcionalDias = calcularFeriado(
    mesesTrabajados,
    diasTrabajados,
    datos.diasVacacionesAnuales
  );
  const diasCorridos = proyectarEnCalendario(feriadoProporcionalDias, datos.fechaTermino);
  const feriadoProporcionalMonto = Math.round(valorDia(datos.sueldoBase) * diasCorridos);

  // 4. Indemnizaciones
  const remuneracionBase = datos.sueldoBase + datos.movilizacion + datos.colacion;
  const indemnizacionAvisoPrevio = calcularAvisoPrevio(remuneracionBase, datos.causal);
  const indemnizacionAnosServicio = calcularIndemnizacionAnosServicio(
    mesesTrabajados,
    remuneracionBase,
    datos.causal
  );

  // 5. Nulidad
  const diasNulidad = calcularDiasNulidad(datos.fechaTermino, datos.fechaConsulta);
  const montoNulidad = Math.round(valorDia(datos.sueldoBase) * diasNulidad);

  // 6. Horas/minutos extra permanentes
  const valorHoraExtra = Math.round((datos.sueldoBase / 30 / 8) * 1.5);
  const montoHorasExtra =
    valorHoraExtra * datos.horasExtraPermanentes +
    Math.round((valorHoraExtra / 60) * datos.minutosExtraPermanentes);

  // 7. Totales
  const totalBruto =
    remUltimosDias +
    feriadoProporcionalMonto +
    indemnizacionAvisoPrevio +
    indemnizacionAnosServicio +
    montoHorasExtra +
    datos.asignacionFamiliar;

  const totalLiquido =
    totalBruto - datos.anticipoSueldo - datos.otrosDescuentos;

  const totalConNulidad = totalLiquido + montoNulidad;

  // 8. Alertas internas (admin)
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
        `ALERTA: Bono "${bono.nombre}" ($${bono.monto.toLocaleString("es-CL")}) marcado como no cotizable — revisar evasión.`
      );
    }
  }

  return {
    mesesTrabajados,
    diasTrabajados,
    remUltimosDias,
    cotizacionesUltimosDias,
    feriadoProporcionalDias,
    feriadoProporcionalMonto,
    indemnizacionAvisoPrevio,
    indemnizacionAnosServicio,
    diasNulidad,
    montoNulidad,
    anticipoSueldo: datos.anticipoSueldo,
    otrosDescuentos: datos.otrosDescuentos,
    asignacionFamiliar: datos.asignacionFamiliar,
    totalBruto,
    totalLiquido,
    totalConNulidad,
    alertas,
  };
}
