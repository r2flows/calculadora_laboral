import type { AFP, ContratoTipo, TipoSalud } from "./tipos";
import {
  tasaAfpVigente,
  TASA_FONASA,
  TASA_AFC_TRABAJADOR_INDEFINIDO,
  calcularAsignacionFamiliarVigente,
} from "./vigencias";

/**
 * Gratificación mensual legal (Art. 50 CT):
 * min(sueldoBase × 25%, 4,75 IMM / 12)
 * Es remuneración imponible — afecta AFP, salud y AFC.
 * Si gratificacionFija > 0 se usa ese valor en lugar del cálculo automático.
 * El tope se calcula con el IMM vigente a la fecha de término (ver jornada.ts).
 */
export function calcularGratificacionMensual(
  sueldoBase: number,
  gratificacionFija: number,
  topeGratificacion: number
): number {
  if (gratificacionFija > 0) return gratificacionFija;
  return Math.min(Math.round(sueldoBase * 0.25), topeGratificacion);
}

export interface DescuentosCalculados {
  afp: number;
  salud: number;
  afc: number;
  total: number;
}

/**
 * Descuentos previsionales sobre una remuneración imponible.
 * El AFC del trabajador (0,6%) solo aplica en contratos indefinidos — en plazo fijo
 * u obra/faena el AFC lo paga íntegramente el empleador (ver lib/calculos/causales.ts,
 * calcularAfcEmpleador). Las tasas AFP se resuelven por fecha vigente (vigencias.ts).
 */
export function calcularDescuentos(
  remuneracionImponible: number,
  afp: AFP,
  tipoSalud: TipoSalud,
  montoIsapre: number,
  contratoTipo: ContratoTipo,
  fecha: string
): DescuentosCalculados {
  const descAfp = Math.round(remuneracionImponible * tasaAfpVigente(afp, fecha));
  const descSalud =
    tipoSalud === "Fonasa"
      ? Math.round(remuneracionImponible * TASA_FONASA)
      : montoIsapre;
  const descAfc =
    contratoTipo === "indefinido"
      ? Math.round(remuneracionImponible * TASA_AFC_TRABAJADOR_INDEFINIDO)
      : 0;

  return {
    afp: descAfp,
    salud: descSalud,
    afc: descAfc,
    total: descAfp + descSalud + descAfc,
  };
}

export function calcularAsignacionFamiliar(
  sueldoBruto: number,
  cargas: number,
  fecha: string
): number {
  return calcularAsignacionFamiliarVigente(sueldoBruto, cargas, fecha);
}
