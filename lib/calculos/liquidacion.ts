import type { AFP, ContratoTipo, TipoSalud } from "./tipos";
import { calcularGratificacionMensual, calcularDescuentos } from "./cotizaciones";
import { calcularImpuestoRenta } from "./impuesto";
import { topeGratificacionMensual } from "./jornada";

function fmtCLP(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export interface DatosLiquidacion {
  contratoTipo: ContratoTipo;
  sueldoBase: number;
  horasExtraMonto: number;
  bonosImponibles: number;
  recibeGratificacion: boolean;
  gratificacionFija: number; // 0 = calcular automático (25% con tope)
  movilizacion: number;
  colacion: number;
  afp: AFP;
  tipoSalud: TipoSalud;
  montoIsapre: number;
  anticipoSueldo: number;
  otrosDescuentos: number;
  asignacionFamiliar: number;
  montoRecibido: number;
}

export interface ResultadoLiquidacion {
  totalImponible: number;
  gratificacionMonto: number;
  descAFP: number;
  descSalud: number;
  descAFC: number;
  descImpuesto: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquidoCalculado: number;
  montoRecibido: number;
  diferencia: number;
  alertas: string[];
}

/**
 * Verifica si una liquidación mensual coincide con lo que corresponde legalmente.
 * `fecha` (ISO, por defecto hoy) determina las tasas AFP/UTM y el tope de gratificación
 * vigentes (ver lib/calculos/vigencias.ts y jornada.ts).
 */
export function calcularLiquidacion(
  datos: DatosLiquidacion,
  fecha: string = new Date().toISOString().split("T")[0]
): ResultadoLiquidacion {
  const topeGratificacion = topeGratificacionMensual(fecha);
  const gratificacionMonto = datos.recibeGratificacion
    ? calcularGratificacionMensual(datos.sueldoBase, datos.gratificacionFija, topeGratificacion)
    : 0;

  const totalImponible =
    datos.sueldoBase + datos.horasExtraMonto + datos.bonosImponibles + gratificacionMonto;

  const descuentos = calcularDescuentos(
    totalImponible,
    datos.afp,
    datos.tipoSalud,
    datos.montoIsapre,
    datos.contratoTipo,
    fecha
  );

  const baseImpuesto = totalImponible - descuentos.afp - descuentos.salud;
  const descImpuesto = calcularImpuestoRenta(baseImpuesto, fecha);

  const totalHaberes = totalImponible + datos.movilizacion + datos.colacion + datos.asignacionFamiliar;
  const totalDescuentos = descuentos.total + descImpuesto + datos.anticipoSueldo + datos.otrosDescuentos;
  const totalLiquidoCalculado = totalHaberes - totalDescuentos;
  const diferencia = datos.montoRecibido - totalLiquidoCalculado;

  const alertas: string[] = [];
  if (Math.abs(diferencia) > 1000) {
    alertas.push(
      diferencia < 0
        ? `Te pagaron ${fmtCLP(Math.abs(diferencia))} menos de lo que corresponde.`
        : `Recibiste ${fmtCLP(diferencia)} más de lo calculado. Revisa si hay conceptos adicionales.`
    );
  }
  if (datos.contratoTipo !== "indefinido") {
    alertas.push(
      "En contratos a plazo fijo u obra, el AFC lo paga íntegramente el empleador (3%). No debe descontarse de tu sueldo."
    );
  }

  return {
    totalImponible,
    gratificacionMonto,
    descAFP: descuentos.afp,
    descSalud: descuentos.salud,
    descAFC: descuentos.afc,
    descImpuesto,
    totalHaberes,
    totalDescuentos,
    totalLiquidoCalculado,
    montoRecibido: datos.montoRecibido,
    diferencia,
    alertas,
  };
}
