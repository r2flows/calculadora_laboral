import { labelCausal } from "@/lib/calculos/causalesLegado";

export const CAMPO: Record<string, { label: string; fmt: "currency" | "date" | "bool" | "causal" | "dias" | "text" }> = {
  fechaInicio:           { label: "Fecha inicio contrato",       fmt: "date" },
  fechaTermino:          { label: "Fecha término",               fmt: "date" },
  causal:                { label: "Causal de término",           fmt: "causal" },
  contratoTipo:          { label: "Tipo de contrato",             fmt: "text" },
  causalEsCorrecta:      { label: "¿Causal invocada correctamente?", fmt: "bool" },
  tienePruebas:          { label: "¿Tiene pruebas de despido injustificado?", fmt: "bool" },
  recibioCarta30Dias:    { label: "¿Recibió carta con 30 días de aviso?", fmt: "bool" },
  afcDescontadoEnFiniquito: { label: "AFC ya descontado en finiquito", fmt: "currency" },
  cotizacionesAlDia:     { label: "¿Cotizaciones al día al despido?", fmt: "bool" },
  sueldoBase:            { label: "Sueldo base",                 fmt: "currency" },
  movilizacion:          { label: "Movilización mensual",        fmt: "currency" },
  colacion:              { label: "Colación mensual",            fmt: "currency" },
  afp:                   { label: "AFP",                         fmt: "text" },
  tipoSalud:             { label: "Previsión de salud",          fmt: "text" },
  montoIsapre:           { label: "Monto Isapre mensual",        fmt: "currency" },
  recibeGratificacion:   { label: "Recibe gratificación",        fmt: "bool" },
  diasVacacionesAnuales: { label: "Vacaciones anuales",          fmt: "dias" },
  diasVacacionesTomados: { label: "Días de vacaciones tomados",  fmt: "dias" },
  jornadaSemanal:        { label: "Jornada semanal (hrs)",       fmt: "text" },
  reciboRemuneracionUltimoMes: { label: "¿Ya pagaron el último mes?", fmt: "bool" },
  anticipoSueldo:        { label: "Anticipo de sueldo",          fmt: "currency" },
  otrosDescuentos:       { label: "Otros descuentos",            fmt: "currency" },
  asignacionFamiliar:    { label: "Asignación familiar",         fmt: "currency" },
};

export const TIPO_DOC: Record<string, string> = {
  liquidacion:   "Liquidación de sueldo",
  finiquito:     "Finiquito",
  contrato:      "Contrato de trabajo",
  carta_despido: "Carta de despido",
  otro:          "Otro documento",
};

// Incluye ambos formatos: snake_case (documentos extraídos antes de unificar el
// pipeline de IA, ver lib/extraccion/) y camelCase (documentos extraídos con el motor
// unificado desde ahora en adelante) — mismo criterio no destructivo que labelCausal.
export const CAMPO_EXTRAIDO: Record<string, { label: string; fmt: "currency" | "text" | "date" }> = {
  empleador:               { label: "Empleador",             fmt: "text" },
  rut_empleador:           { label: "RUT empleador",         fmt: "text" },
  rutEmpleador:            { label: "RUT empleador",         fmt: "text" },
  periodo:                 { label: "Período",               fmt: "text" },
  sueldo_base:             { label: "Sueldo base",           fmt: "currency" },
  sueldoBase:              { label: "Sueldo base",           fmt: "currency" },
  gratificacion:           { label: "Gratificación",         fmt: "currency" },
  movilizacion:            { label: "Movilización",          fmt: "currency" },
  colacion:                { label: "Colación",              fmt: "currency" },
  bonos:                   { label: "Bonos",                 fmt: "currency" },
  horas_extra:             { label: "Horas extra",           fmt: "currency" },
  horasExtraMonto:         { label: "Horas extra",           fmt: "currency" },
  total_haberes:           { label: "Total haberes",         fmt: "currency" },
  totalHaberes:            { label: "Total haberes",         fmt: "currency" },
  afp_nombre:              { label: "AFP",                   fmt: "text" },
  afp:                     { label: "AFP",                   fmt: "text" },
  prevision:               { label: "Previsión",             fmt: "text" },
  montoIsapre:             { label: "Monto Isapre",          fmt: "currency" },
  descuento_afp:           { label: "Descuento AFP",         fmt: "currency" },
  descuentoAfp:            { label: "Descuento AFP",         fmt: "currency" },
  descuento_salud:         { label: "Descuento salud",       fmt: "currency" },
  descuentoSalud:          { label: "Descuento salud",       fmt: "currency" },
  total_descuentos:        { label: "Total descuentos",      fmt: "currency" },
  totalDescuentos:         { label: "Total descuentos",      fmt: "currency" },
  liquido_a_pagar:         { label: "Líquido a pagar",       fmt: "currency" },
  liquidoRecibido:         { label: "Líquido recibido",      fmt: "currency" },
  fecha_inicio_contrato:   { label: "Inicio contrato",       fmt: "date" },
  fechaIngreso:            { label: "Inicio contrato",       fmt: "date" },
  fecha_termino_contrato:  { label: "Término contrato",      fmt: "date" },
  fechaEgreso:             { label: "Término contrato",      fmt: "date" },
  causal_termino:          { label: "Causal de término",     fmt: "text" },
  causal:                  { label: "Causal de término",     fmt: "text" },
  fechaCartaAviso:         { label: "Fecha carta de aviso",   fmt: "date" },
  montoFiniquitoFirmado:   { label: "Monto finiquito firmado", fmt: "currency" },
  afcDescontado:           { label: "AFC descontado",        fmt: "currency" },
  contratoTipo:            { label: "Tipo de contrato",      fmt: "text" },
  jornadaSemanal:          { label: "Jornada semanal (hrs)", fmt: "text" },
};

export function fmtCLP(v: unknown) {
  const n = Number(v);
  if (!n && n !== 0) return "—";
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export function fmtFecha(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-CL");
}

export function renderValor(v: unknown, tipo: "currency" | "date" | "bool" | "causal" | "dias" | "text") {
  if (v === null || v === undefined) return "—";
  if (tipo === "currency")  return fmtCLP(v);
  if (tipo === "date")      return fmtFecha(v);
  if (tipo === "bool")      return v ? "Sí" : "No";
  if (tipo === "causal")    return labelCausal(v);
  if (tipo === "dias")      return `${v} días hábiles`;
  return String(v);
}
