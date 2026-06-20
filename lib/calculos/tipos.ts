export type AFP =
  | "Capital"
  | "Cuprum"
  | "Habitat"
  | "PlanVital"
  | "Provida"
  | "Uno"
  | "Modelo";

export type TipoSalud = "Fonasa" | "Isapre";

export type CausalDespido =
  | "art159_1"   // mutuo acuerdo
  | "art159_2"   // vencimiento plazo
  | "art159_3"   // conclusión trabajo
  | "art159_4"   // caso fortuito
  | "art159_5"   // renuncia voluntaria
  | "art159_6"   // muerte trabajador
  | "art160"     // necesidades empresa
  | "art161"     // necesidades empresa (con indemnización)
  | "art161a"    // desahucio
  | "autodespido";

export interface DatosFiniquito {
  // Identificación modo
  esAdmin: boolean;

  // Contrato
  fechaInicio: Date;
  fechaTermino: Date;
  causal: CausalDespido;
  fechaConsulta: Date;

  // Remuneración
  sueldoBase: number;
  movilizacion: number;
  colacion: number;
  otrosBonos: { nombre: string; monto: number; esCotizable: boolean }[];

  // Previsión
  afp: AFP;
  tipoSalud: TipoSalud;
  montoIsapre: number; // solo si Isapre

  // Gratificación
  recibeGratificacion: boolean;
  gratificacionMensualFija: number; // 0 = calcular automático (25% con tope)

  // Vacaciones
  tieneProgressivo: boolean;
  diasVacacionesAnuales: number; // 15 por defecto, más si hay progresivo
  diasVacacionesTomados: number; // días hábiles ya gozados durante el contrato

  // Últimos días
  reciboRemuneracionUltimoMes: boolean;

  // Extras
  horasExtraPermanentes: number;
  minutosExtraPermanentes: number;
  anticipoSueldo: number;
  otrosDescuentos: number;
  asignacionFamiliar: number;
  viajaOtraRegion: boolean;
  empresaPagaPasajes: boolean;
}

export interface DesgloseCotizaciones {
  afp: number;
  salud: number;
  afc: number;
  total: number;
}

export interface ResultadoFiniquito {
  // Tiempos
  mesesTrabajados: number;
  diasTrabajados: number;

  // Remuneración imponible
  gratificacionMensual: number;
  remuneracionImponibleTotal: number;

  // Ítems brutos
  remUltimosDias: number;
  cotizacionesUltimosDias: DesgloseCotizaciones;
  feriadoProporcionalDiasCalculados: number;
  feriadoProporcionalDiasDescontados: number;
  feriadoProporcionalDias: number;
  feriadoProporcionalMonto: number;
  indemnizacionAvisoPrevio: number;
  indemnizacionAnosServicio: number;

  // Nulidad
  diasNulidad: number;
  montoNulidad: number;

  // Descuentos liquidación
  anticipoSueldo: number;
  otrosDescuentos: number;
  asignacionFamiliar: number;

  // Impuesto segunda categoría
  tributaImpuesto: boolean;
  impuestoRenta: number;

  // Totales
  totalBruto: number;
  totalLiquido: number;
  totalConNulidad: number;

  // Alertas internas (solo admin)
  alertas: string[];
}
