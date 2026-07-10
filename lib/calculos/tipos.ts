export type AFP =
  | "Capital"
  | "Cuprum"
  | "Habitat"
  | "PlanVital"
  | "Provida"
  | "Uno"
  | "Modelo";

export type TipoSalud = "Fonasa" | "Isapre";

/**
 * Tipo de contrato — determina la tasa de AFC (trabajador solo cotiza en indefinido;
 * en plazo fijo/obra o faena el AFC lo paga íntegramente el empleador) y la tasa de
 * AFC empleador aplicable cuando corresponde (causal 161_1). Ver lib/calculos/vigencias.ts.
 */
export type ContratoTipo = "indefinido" | "plazo_fijo" | "obra_faena";

/**
 * Enum de causales LEGADO — usado hasta la migración del motor de causales granular.
 * Se conserva únicamente para poder seguir leyendo/etiquetando `datos_calculo` histórico
 * ya guardado en Supabase con este formato (ver lib/calculos/causalesLegado.ts).
 * El motor de cálculo actual ya NO produce estos valores, usa CausalDespidoV2.
 */
export type CausalDespidoLegado =
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

/**
 * Causales de término de contrato — modelo granular (reemplaza al enum legado).
 * Cubre las causales del Art. 159 (sin indemnización), Art. 160 (despido con causa,
 * con recargo del Art. 168 si se determina que la causal se invocó incorrectamente) y
 * Art. 161 (necesidades de la empresa, con indemnización + aviso previo + AFC empleador).
 * Ver metadata y reglas de recargo/indemnización en lib/calculos/causales.ts.
 */
export type CausalDespidoV2 =
  | "159_2"    // Renuncia voluntaria
  | "159_4"    // Vencimiento del plazo convenido
  | "159_5"    // Conclusión del trabajo, obra o faena
  | "160_1a"   // Conducta indebida de carácter grave (recargo 100% si se invocó mal)
  | "160_1b"   // Conducta indebida no grave (recargo 80% si se invocó mal)
  | "160_3"    // Inasistencias injustificadas (recargo 80% si se invocó mal)
  | "160_4"    // Abandono del trabajo (recargo 80% si se invocó mal)
  | "160_5"    // Daño material intencional (recargo 100% si se invocó mal)
  | "160_6"    // Injuria grave al empleador o su familia (recargo 100% si se invocó mal)
  | "160_7"    // Incumplimiento grave de obligaciones del contrato (recargo 80% si se invocó mal)
  | "161_1"    // Necesidades de la empresa (indemnización + aviso previo + recargo 30% + AFC empleador)
  // Autodespido / despido indirecto (Art. 171): el TRABAJADOR pone término al contrato
  // invocando una falta grave del EMPLEADOR. Solo procede citando estas 3 causales del
  // Art. 160 (a diferencia del despido regular, aquí siempre da indemnización + aviso
  // previo + recargo fijo, sin depender de "causalEsCorrecta"/"tienePruebas").
  | "autodespido_160_1"  // Falta de probidad, conducta inmoral o indebida grave del empleador (recargo 80%)
  | "autodespido_160_5"  // Actos, omisiones o imprudencias del empleador que afecten seguridad/salud (recargo 80%)
  | "autodespido_160_7"; // Incumplimiento grave de las obligaciones del contrato por el empleador (recargo 50%)

/** Alias del tipo vigente — todo código nuevo debe referirse a este nombre. */
export type CausalDespido = CausalDespidoV2;

export interface DatosFiniquito {
  // Identificación modo
  esAdmin: boolean;

  // Contrato
  fechaInicio: Date;
  fechaTermino: Date;
  causal: CausalDespido;
  contratoTipo: ContratoTipo;
  fechaConsulta: Date;

  // Causal — datos adicionales para recargo Art. 168 / indemnización / AFC empleador
  causalEsCorrecta: boolean; // ¿el empleador invocó correctamente la causal 160_x? si es false, se trata como despido injustificado (indemnización + recargo)
  tienePruebas: boolean; // ¿el empleador cuenta con pruebas de la causal invocada? afecta el % de recargo si causalEsCorrecta=false
  recibioCarta30Dias: boolean; // solo relevante para causal 161_1: ¿recibió aviso con 30 días de anticipación?

  // Jornada — necesaria para el valor de la hora extra (Art. 32, paramétrico por jornada legal vigente)
  jornadaSemanal: number; // horas semanales pactadas (40/42/44/45 según Ley 21.561, o jornada parcial)

  // AFC empleador (solo relevante si causal=161_1) — monto que el empleador ya haya
  // descontado/pagado en el finiquito firmado, para no exigirlo dos veces.
  afcDescontadoEnFiniquito: number;

  // Nulidad del despido (Ley Bustos) — SOLO procede si el empleador no tenía las
  // cotizaciones (AFP/salud/AFC) al día en la fecha del despido. Sin esta pregunta el
  // motor no puede saber si corresponde calcular nulidad o no.
  cotizacionesAlDia: boolean;

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
  anosServicio: number; // años con tope de 11 usados para la indemnización (ver lib/calculos/indemnizacion.ts)

  // Remuneración imponible
  topeGratificacionMensual: number; // 4,75 × IMM vigente / 12 (Art. 50 CT)
  gratificacionMensual: number;
  remuneracionImponibleTotal: number;
  valorDia: number; // remuneracionImponibleTotal / 30

  // Ítems brutos
  remUltimosDias: number;
  cotizacionesUltimosDias: DesgloseCotizaciones;
  feriadoProporcionalDiasCalculados: number;
  feriadoProporcionalDiasDescontados: number;
  feriadoProporcionalDias: number;
  feriadoProporcionalMonto: number;
  indemnizacionAvisoPrevio: number; // mes de aviso sustitutivo (solo causal 161_1 sin carta de 30 días)
  montoPorAnoIndemnizacion: number; // min(remuneraciónBase, 90 UF vigente) — antes de multiplicar por años
  indemnizacionAnosServicio: number;
  recargoArt168Porcentaje: number; // % aplicado (0/30/50/80/100 según causal)
  montoRecargoArt168: number; // recargo legal cuando la causal invocada resulta incorrecta
  afcEmpleadorPendiente: number; // AFC que debía pagar el empleador (causal 161_1) y no conste haber pagado
  valorHoraExtra: number;
  montoHorasExtra: number;

  // Nulidad
  diasNulidad: number;
  montoNulidad: number;

  // Descuentos liquidación
  anticipoSueldo: number;
  otrosDescuentos: number;
  asignacionFamiliar: number;

  // Impuesto segunda categoría
  tasaAfpAplicada: number; // tasa vigente de la AFP del trabajador, a la fecha de término
  tributaImpuesto: boolean;
  baseImpuesto: number;
  impuestoRenta: number;

  // Valores legales vigentes usados en este cálculo (para auditoría — ver /admin/algoritmo)
  immVigente: number;
  ufVigente: number;
  utmVigente: number;

  // Totales
  totalBruto: number;
  totalLiquido: number;
  totalConNulidad: number;

  // Alertas — `alertas` es seguro de mostrar al cliente (informativo, sin conclusiones
  // legales). `alertasInternas` es solo para admin/abogado: cita causal, artículo, el
  // dato declarado que gatilla la regla y el monto exacto — nunca mostrar al cliente
  // sin revisión de un abogado, porque son hipótesis legales, no hechos confirmados.
  alertas: string[];
  alertasInternas: string[];
}
