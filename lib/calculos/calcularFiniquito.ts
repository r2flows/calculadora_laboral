import { contarDiasYMeses } from "./conteo";
import { calcularFeriado, proyectarEnCalendario } from "./vacaciones";
import { calcularDiasNulidad } from "./nulidad";
import { calcularIndemnizacionAnosServicio } from "./indemnizacion";
import { calcularRecargoArt168, calcularMesAvisoSustitutivo, calcularAfcEmpleador, explicarRecargoArt168 } from "./causales";
import { calcularRemuneracionUltimosDias, valorDia } from "./remuneracion";
import { calcularGratificacionMensual, calcularDescuentos } from "./cotizaciones";
import { topeGratificacionMensual, immVigente } from "./jornada";
import { calcularImpuestoRenta, tributaImpuesto } from "./impuesto";
import { tasaAfpVigente, ufVigente, utmVigente } from "./vigencias";
import type { DatosFiniquito, ResultadoFiniquito } from "./tipos";

export function calcularFiniquito(datos: DatosFiniquito): ResultadoFiniquito {
  // `alertas`: seguro de mostrar al cliente (hoy vacío — la vista de cliente solo
  // muestra montos totales, ninguna conclusión legal necesita texto adicional).
  // `alertasInternas`: solo admin/abogado — cita causal, artículo, el dato declarado
  // que gatilla la regla y el monto exacto. Nunca mostrar sin revisión legal.
  const alertas: string[] = [];
  const alertasInternas: string[] = [];

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
      datos.montoIsapre,
      datos.contratoTipo
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
  const {
    anos: anosServicio,
    montoPorAno: montoPorAnoIndemnizacion,
    total: indemnizacionAnosServicio,
  } = calcularIndemnizacionAnosServicio(
    mesesTrabajados,
    remuneracionBaseIndemnizacion,
    datos.causal,
    datos.causalEsCorrecta,
    fechaTerminoISO
  );
  // Mes de aviso sustitutivo (Art. 162) — solo causal 161_1 sin carta de 30 días
  const indemnizacionAvisoPrevio = calcularMesAvisoSustitutivo(
    datos.causal,
    datos.causalEsCorrecta,
    datos.recibioCarta30Dias,
    remuneracionBaseIndemnizacion
  );
  // Recargo Art. 168 — cuando la causal invocada resulta incorrecta
  const { porcentaje: recargoArt168Porcentaje, monto: montoRecargoArt168 } = calcularRecargoArt168(
    datos.causal,
    datos.causalEsCorrecta,
    datos.tienePruebas,
    indemnizacionAnosServicio
  );
  // AFC empleador pendiente (causal 161_1) — base imponible, sin mov./colación
  const afcEmpleadorPendiente = calcularAfcEmpleador(
    datos.causal,
    datos.causalEsCorrecta,
    remuneracionImponibleTotal,
    datos.contratoTipo,
    datos.afcDescontadoEnFiniquito
  );

  // 6. Nulidad (Ley Bustos) — SOLO procede si el empleador no tenía las cotizaciones
  // (AFP/salud/AFC) al día en la fecha del despido. Comparación estricta con `false`
  // a propósito: si el campo no llega (undefined, algún llamador antiguo), el default
  // seguro es NO calcular nulidad, no asumirla — evitar sobreestimar el total.
  const diasNulidad = datos.cotizacionesAlDia === false
    ? calcularDiasNulidad(datos.fechaTermino, datos.fechaConsulta)
    : 0;
  const montoNulidad = Math.round(vDia * diasNulidad);

  // 7. Horas/minutos extra permanentes — Art. 32: valor hora ordinaria × 1,5,
  // paramétrico según la jornada semanal pactada (Ley 21.561 reduce la jornada legal
  // gradualmente; jornadas parciales usan las horas realmente pactadas).
  const valorHoraExtra = Math.round(
    (remuneracionImponibleTotal / 30) * (7 / datos.jornadaSemanal) * 1.5
  );
  const montoHorasExtra = Math.round(
    valorHoraExtra * (datos.horasExtraPermanentes + datos.minutosExtraPermanentes / 60)
  );

  // 8. Impuesto segunda categoría
  // Base = remuneración imponible mensual − AFP − salud (no AFC, no asig. familiar)
  const cotizacionesBase = calcularDescuentos(
    remuneracionImponibleTotal,
    datos.afp,
    datos.tipoSalud,
    datos.montoIsapre,
    datos.contratoTipo,
    fechaTerminoISO
  );
  const baseImpuesto = remuneracionImponibleTotal - cotizacionesBase.afp - cotizacionesBase.salud;
  const impuestoRenta = calcularImpuestoRenta(baseImpuesto, fechaTerminoISO);
  const trabajadorTributa = tributaImpuesto(baseImpuesto, fechaTerminoISO);
  const tasaAfpAplicada = tasaAfpVigente(datos.afp, fechaTerminoISO);

  // 9. Totales
  const totalBruto =
    remUltimosDias +
    feriadoProporcionalMonto +
    indemnizacionAvisoPrevio +
    indemnizacionAnosServicio +
    montoHorasExtra +
    datos.asignacionFamiliar +
    montoRecargoArt168 +
    afcEmpleadorPendiente;

  const totalLiquido =
    totalBruto - datos.anticipoSueldo - datos.otrosDescuentos -
    (trabajadorTributa ? impuestoRenta : 0);
  const totalConNulidad = totalLiquido + montoNulidad;

  // 9. Alertas internas (solo admin/abogado) — cada una cita el dato exacto que la
  // gatilló y el monto involucrado, para que la revisión legal no tenga que adivinar.
  if (datos.movilizacion > 50000) {
    alertasInternas.push(
      `ALERTA EVASIÓN: Movilización declarada de $${datos.movilizacion.toLocaleString("es-CL")}/mes supera el umbral de $50.000 — la asignación de movilización no imponible debe ser proporcional al costo real de traslado (Art. 41 CT); un monto tan alto sugiere que podría estar encubriendo remuneración imponible no cotizada.`
    );
  } else if (datos.movilizacion > 25000) {
    if (datos.viajaOtraRegion && datos.empresaPagaPasajes) {
      alertasInternas.push(
        `AVISO: Movilización declarada de $${datos.movilizacion.toLocaleString("es-CL")}/mes (entre $25.000 y $50.000) — el usuario declaró viajar a otra región con pasajes pagados por la empresa. Verificar si corresponde a un viático de traslado legítimo antes de cuestionar su cotizabilidad.`
      );
    } else if (!datos.viajaOtraRegion) {
      alertasInternas.push(
        `AVISO: Movilización declarada de $${datos.movilizacion.toLocaleString("es-CL")}/mes (entre $25.000 y $50.000) sin viaje a otra región declarado — revisar si es proporcional al costo real de traslado (Art. 41 CT).`
      );
    }
  }

  if (datos.colacion > 30000) {
    alertasInternas.push(
      `ALERTA EVASIÓN: Colación declarada de $${datos.colacion.toLocaleString("es-CL")}/mes supera el umbral de $30.000 — revisar si es proporcional al costo real de alimentación o podría encubrir remuneración imponible no cotizada.`
    );
  }

  for (const bono of datos.otrosBonos) {
    if (!bono.esCotizable) {
      alertasInternas.push(
        `ALERTA EVASIÓN: Bono "${bono.nombre}" de $${bono.monto.toLocaleString("es-CL")} declarado como no cotizable — verificar si corresponde legalmente a un ítem no imponible o si debió cotizarse.`
      );
    }
  }

  const explicacionRecargo = explicarRecargoArt168(
    datos.causal,
    datos.causalEsCorrecta,
    datos.tienePruebas,
    recargoArt168Porcentaje,
    montoRecargoArt168
  );
  if (explicacionRecargo) alertasInternas.push(explicacionRecargo);

  if (afcEmpleadorPendiente > 0) {
    const tasaAfcEmpleador = datos.contratoTipo === "indefinido" ? 2.4 : 3.0;
    alertasInternas.push(
      `Causal 161_1, contrato ${datos.contratoTipo}: AFC empleador (Art. 161 inciso 2°) = ${tasaAfcEmpleador}% de $${remuneracionImponibleTotal.toLocaleString("es-CL")} imponible` +
      (datos.afcDescontadoEnFiniquito > 0 ? `, menos $${datos.afcDescontadoEnFiniquito.toLocaleString("es-CL")} ya descontado en el finiquito` : "") +
      ` = $${afcEmpleadorPendiente.toLocaleString("es-CL")} pendiente de exigir al empleador.`
    );
  }

  return {
    mesesTrabajados,
    diasTrabajados,
    anosServicio,
    topeGratificacionMensual: topeGratif,
    gratificacionMensual,
    remuneracionImponibleTotal,
    valorDia: vDia,
    remUltimosDias,
    cotizacionesUltimosDias,
    feriadoProporcionalDiasCalculados,
    feriadoProporcionalDiasDescontados,
    feriadoProporcionalDias,
    feriadoProporcionalMonto,
    indemnizacionAvisoPrevio,
    montoPorAnoIndemnizacion,
    indemnizacionAnosServicio,
    recargoArt168Porcentaje,
    montoRecargoArt168,
    afcEmpleadorPendiente,
    valorHoraExtra,
    montoHorasExtra,
    diasNulidad,
    montoNulidad,
    anticipoSueldo: datos.anticipoSueldo,
    otrosDescuentos: datos.otrosDescuentos,
    asignacionFamiliar: datos.asignacionFamiliar,
    tasaAfpAplicada,
    tributaImpuesto: trabajadorTributa,
    baseImpuesto,
    impuestoRenta,
    immVigente: immVigente(fechaTerminoISO),
    ufVigente: ufVigente(fechaTerminoISO),
    utmVigente: utmVigente(fechaTerminoISO),
    totalBruto,
    totalLiquido,
    totalConNulidad,
    alertas,
    alertasInternas,
  };
}
