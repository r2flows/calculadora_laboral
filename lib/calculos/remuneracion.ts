import { diasMesEnCurso, diasEnMes } from "./conteo";
import { calcularDescuentos, type DescuentosCalculados } from "./cotizaciones";
import type { AFP, ContratoTipo, TipoSalud } from "./tipos";

export interface ResultadoUltimosDias {
  diasTrabajados: number;
  montoBruto: number;
  cotizaciones: DescuentosCalculados;
  montoLiquido: number;
}

/**
 * Remuneración de los últimos días del mes cuando no fueron cancelados.
 * Días desde el 1 del mes hasta el día del despido, ambos incluidos.
 * Usa métodos UTC para evitar desfases de timezone.
 */
export function calcularRemuneracionUltimosDias(
  fechaDespido: Date,
  sueldoMensual: number,
  afp: AFP,
  tipoSalud: TipoSalud,
  montoIsapre: number,
  contratoTipo: ContratoTipo
): ResultadoUltimosDias {
  const diasTrabajados = diasMesEnCurso(fechaDespido);
  const totalDiasMes   = diasEnMes(fechaDespido);
  const montoBruto     = Math.round((sueldoMensual / totalDiasMes) * diasTrabajados);
  const fechaISO       = fechaDespido.toISOString().split("T")[0];
  const cotizaciones   = calcularDescuentos(montoBruto, afp, tipoSalud, montoIsapre, contratoTipo, fechaISO);

  return {
    diasTrabajados,
    montoBruto,
    cotizaciones,
    montoLiquido: montoBruto - cotizaciones.total,
  };
}

/** Valor día (divisor 30 según ley). */
export function valorDia(sueldoMensual: number): number {
  return Math.round(sueldoMensual / 30);
}
