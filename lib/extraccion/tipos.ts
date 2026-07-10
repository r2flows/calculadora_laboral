import type { CausalDespidoV2, ContratoTipo } from "@/lib/calculos/tipos";

/** Tipos de documento que el pipeline de extracción reconoce. */
export type DocTipo =
  | "contrato"
  | "anexo"
  | "carta_aviso"
  | "finiquito"
  | "liquidacion"
  | "transferencia"
  | "otro";

export interface DocumentoEntrada {
  tipo: DocTipo;
  base64: string;
  /** image/jpeg | image/png | image/webp | application/pdf */
  mediaType: string;
}

/**
 * Datos extraídos por IA desde uno o más documentos laborales. Todos los campos son
 * opcionales — la extracción es best-effort y el wizard siempre permite completar o
 * corregir manualmente lo que falte o esté mal reconocido. Los valores de `causal` y
 * `contratoTipo` no están garantizados a coincidir con los enums de lib/calculos/tipos
 * (el modelo puede alucinar) — quien consuma este tipo debe validar antes de usarlos
 * para calcular.
 */
export interface DatosExtraidos {
  empleador?: string;
  rutEmpleador?: string;
  periodo?: string;

  fechaIngreso?: string; // YYYY-MM-DD
  fechaEgreso?: string;
  contratoTipo?: ContratoTipo;
  jornadaSemanal?: number;

  sueldoBase?: number;
  gratificacion?: number;
  bonos?: number;
  movilizacion?: number;
  colacion?: number;
  horasExtraMonto?: number;
  totalHaberes?: number;

  afp?: string;
  prevision?: "fonasa" | "isapre";
  montoIsapre?: number;
  descuentoAfp?: number;
  descuentoSalud?: number;
  totalDescuentos?: number;

  causal?: CausalDespidoV2;
  fechaCartaAviso?: string;
  montoFiniquitoFirmado?: number;
  afcDescontado?: number;

  liquidoRecibido?: number;
}
