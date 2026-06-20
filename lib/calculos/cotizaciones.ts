import type { AFP, TipoSalud } from "./tipos";

// Tasas AFP vigentes (tasa trabajador, excluye SIS)
const TASAS_AFP: Record<AFP, number> = {
  Capital: 0.1127,
  Cuprum: 0.1144,
  Habitat: 0.1127,
  Modelo: 0.1058,
  PlanVital: 0.1116,
  Provida: 0.1145,
  Uno: 0.1069,
};

const TASA_FONASA = 0.07;
const TASA_AFC_TRABAJADOR = 0.006; // contrato indefinido

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

export function calcularDescuentos(
  remuneracionImponible: number,
  afp: AFP,
  tipoSalud: TipoSalud,
  montoIsapre: number
): DescuentosCalculados {
  const descAfp = Math.round(remuneracionImponible * TASAS_AFP[afp]);
  const descSalud =
    tipoSalud === "Fonasa"
      ? Math.round(remuneracionImponible * TASA_FONASA)
      : montoIsapre;
  const descAfc = Math.round(remuneracionImponible * TASA_AFC_TRABAJADOR);

  return {
    afp: descAfp,
    salud: descSalud,
    afc: descAfc,
    total: descAfp + descSalud + descAfc,
  };
}

// Tabla asignación familiar 2024 (tramos por ingreso mensual)
export const TABLA_ASIGNACION_FAMILIAR: {
  montoMaximo: number;
  montoAsignacion: number;
}[] = [
  { montoMaximo: 390255, montoAsignacion: 16899 },
  { montoMaximo: 569646, montoAsignacion: 10368 },
  { montoMaximo: 882589, montoAsignacion: 3276 },
  { montoMaximo: Infinity, montoAsignacion: 0 },
];

export function calcularAsignacionFamiliar(
  sueldoBruto: number,
  cargas: number
): number {
  const tramo = TABLA_ASIGNACION_FAMILIAR.find(
    (t) => sueldoBruto <= t.montoMaximo
  );
  return (tramo?.montoAsignacion ?? 0) * cargas;
}
