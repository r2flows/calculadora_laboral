import type { CausalDespidoV2 } from "./tipos";
import { tieneDerechoIndemnizacion } from "./causales";
import { ufVigente } from "./vigencias";

const TOPE_ANOS = 11;
const TOPE_INDEMNIZACION_UF = 90;

/**
 * Indemnización por años de servicio (Art. 163).
 * 1 mes de remuneración por cada año trabajado (fracción > 6 meses = 1 año).
 * Tope: 11 años Y 90 UF por año (el que sea menor de los dos topes se aplica primero
 * al monto mensual, luego se multiplica por los años con tope). El monto por UF usa
 * la UF vigente a la fecha de término (ver lib/calculos/vigencias.ts).
 */
export interface ResultadoIndemnizacionAnosServicio {
  anos: number; // años computados, con tope de 11 ya aplicado
  montoPorAno: number; // remuneración base topada a 90 UF
  total: number;
}

export function calcularIndemnizacionAnosServicio(
  meses: number,
  remuneracionBase: number,
  causal: CausalDespidoV2,
  causalEsCorrecta: boolean,
  fechaTerminoISO: string
): ResultadoIndemnizacionAnosServicio {
  if (!tieneDerechoIndemnizacion(causal, causalEsCorrecta)) {
    return { anos: 0, montoPorAno: 0, total: 0 };
  }

  const anosCompletos = Math.floor(meses / 12);
  const mesesResiduo = meses % 12;
  const anos = anosCompletos + (mesesResiduo >= 6 ? 1 : 0);
  const anosConTope = Math.min(anos, TOPE_ANOS);

  const topeUF = TOPE_INDEMNIZACION_UF * ufVigente(fechaTerminoISO);
  const montoPorAno = Math.min(remuneracionBase, topeUF);

  return { anos: anosConTope, montoPorAno, total: Math.round(anosConTope * montoPorAno) };
}
