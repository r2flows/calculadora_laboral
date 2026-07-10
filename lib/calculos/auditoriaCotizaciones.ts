import type { AFP, ContratoTipo, TipoSalud } from "./tipos";
import {
  tasaAfpVigente,
  TASA_FONASA,
  TASA_FONASA_CON_CAJA,
  TASA_AFC_TRABAJADOR_INDEFINIDO,
} from "./vigencias";
import { calcularDiasNulidad } from "./nulidad";
import { valorDia } from "./remuneracion";

export interface ItemAuditoria {
  label: string;
  esperado: number;
  declarado: number;
  diferencia: number;
  tasaEsperada: string;
}

export interface DatosAuditoriaCotizaciones {
  contratoTipo: ContratoTipo;
  sueldoImponible: number;
  afp: AFP;
  montoAfpDeclarado: number;
  tipoSalud: TipoSalud;
  tieneCaja: boolean;
  montoSaludDeclarado: number;
  montoAfcDeclarado: number;
  /** ¿Fue despedido? Si es así y hay irregularidades, se calcula el monto de nulidad. */
  fueDespedido: boolean;
  fechaDespido?: string; // ISO — requerido si fueDespedido=true
}

export interface ResultadoAuditoriaCotizaciones {
  imponible: number;
  items: ItemAuditoria[];
  totalEsperado: number;
  totalDeclarado: number;
  totalDiferencia: number;
  alertas: string[];
  hayNulidad: boolean;
  diasNulidad: number;
  montoNulidad: number;
}

/**
 * Audita las cotizaciones declaradas en una liquidación contra lo que corresponde
 * legalmente (AFP, salud, AFC), y si el trabajador fue despedido y hay irregularidades,
 * calcula el monto en pesos de la nulidad del despido (días sin cotizar × valor día),
 * reutilizando lib/calculos/nulidad.ts — a diferencia de la versión anterior, que solo
 * marcaba un flag booleano sin monetizar.
 * `fecha` (ISO, por defecto hoy) determina la tasa AFP vigente (ver vigencias.ts).
 */
export function calcularAuditoriaCotizaciones(
  d: DatosAuditoriaCotizaciones,
  fecha: string = new Date().toISOString().split("T")[0]
): ResultadoAuditoriaCotizaciones {
  const tasaAfp = tasaAfpVigente(d.afp, fecha);
  const afpEsperado = Math.round(d.sueldoImponible * tasaAfp);

  let saludEsperado: number;
  let saludTasaLabel: string;
  if (d.tipoSalud === "Fonasa") {
    const tasa = d.tieneCaja ? TASA_FONASA_CON_CAJA : TASA_FONASA;
    saludEsperado = Math.round(d.sueldoImponible * tasa);
    saludTasaLabel = d.tieneCaja ? "2,8% (con caja de compensación)" : "7%";
  } else {
    // Isapre: el monto declarado se toma como el pactado (no se calcula).
    saludEsperado = d.montoSaludDeclarado;
    saludTasaLabel = "Monto pactado";
  }

  const afcEsperado =
    d.contratoTipo === "indefinido" ? Math.round(d.sueldoImponible * TASA_AFC_TRABAJADOR_INDEFINIDO) : 0;
  const afcTasaLabel =
    d.contratoTipo === "indefinido" ? "0,6% (indefinido)" : "0% (obra/plazo — solo empleador)";

  const items: ItemAuditoria[] = [
    {
      label: `AFP ${d.afp}`,
      esperado: afpEsperado,
      declarado: d.montoAfpDeclarado,
      diferencia: afpEsperado - d.montoAfpDeclarado,
      tasaEsperada: `${(tasaAfp * 100).toFixed(2)}%`,
    },
    {
      label: `Salud (${d.tipoSalud})`,
      esperado: saludEsperado,
      declarado: d.montoSaludDeclarado,
      diferencia: saludEsperado - d.montoSaludDeclarado,
      tasaEsperada: saludTasaLabel,
    },
    {
      label: "AFC (Seguro Cesantía)",
      esperado: afcEsperado,
      declarado: d.montoAfcDeclarado,
      diferencia: afcEsperado - d.montoAfcDeclarado,
      tasaEsperada: afcTasaLabel,
    },
  ];

  const totalEsperado = afpEsperado + saludEsperado + afcEsperado;
  const totalDeclarado = d.montoAfpDeclarado + d.montoSaludDeclarado + d.montoAfcDeclarado;
  const totalDiferencia = totalEsperado - totalDeclarado;

  const hayIrregularidad = items.some((i) => Math.abs(i.diferencia) > 500);
  const noDeclaroAfp = afpEsperado > 0 && d.montoAfpDeclarado === 0;

  let diasNulidad = 0;
  let montoNulidad = 0;
  let hayNulidad = false;
  if (d.fueDespedido && d.fechaDespido && hayIrregularidad) {
    diasNulidad = calcularDiasNulidad(new Date(d.fechaDespido), new Date(fecha));
    hayNulidad = diasNulidad > 0;
    montoNulidad = hayNulidad ? Math.round(diasNulidad * valorDia(d.sueldoImponible)) : 0;
  }

  const alertas: string[] = [];
  if (hayIrregularidad) {
    alertas.push("Se detectaron diferencias en las cotizaciones. Esto puede ser causal de nulidad del despido.");
  }
  if (noDeclaroAfp) {
    alertas.push(
      "No se declaró AFP. Si el empleador no cotizó, el despido puede ser nulo y corresponde pagar remuneraciones hasta regularizar."
    );
  }
  if (d.contratoTipo !== "indefinido" && d.montoAfcDeclarado > 0) {
    alertas.push(
      "En contratos a plazo fijo u obra, el AFC lo paga el empleador (3%). No debe descontarse al trabajador. Solicita devolución."
    );
  }
  if (d.tieneCaja && d.tipoSalud === "Fonasa" && d.montoSaludDeclarado > Math.round(d.sueldoImponible * TASA_FONASA_CON_CAJA) + 2000) {
    alertas.push(
      "Con caja de compensación, Fonasa corresponde al 2,8% (la caja aporta el resto). Verifica el descuento."
    );
  }
  if (hayNulidad) {
    alertas.push(
      `Nulidad del despido: ${diasNulidad} días × $${valorDia(d.sueldoImponible).toLocaleString("es-CL")}/día = $${montoNulidad.toLocaleString("es-CL")}.`
    );
  }

  return {
    imponible: d.sueldoImponible,
    items,
    totalEsperado,
    totalDeclarado,
    totalDiferencia,
    alertas,
    hayNulidad,
    diasNulidad,
    montoNulidad,
  };
}
