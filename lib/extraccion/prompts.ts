import type { DocTipo } from "./tipos";

/**
 * Prompt único para extracción de datos laborales — reemplaza los dos prompts
 * separados que existían antes en paralelo (uno para PDFs de liquidación en
 * calculadora_laboral, otro para imágenes multi-documento en aplicacion_abogados).
 * Cubre contrato, anexos, carta de aviso, finiquito, liquidación y comprobante de
 * transferencia en una sola pasada — el modelo omite los campos que no encuentre.
 */
export function buildPrompt(tiposPresentes: DocTipo[]): string {
  return `Eres un experto en documentos laborales chilenos. Analiza los documentos adjuntos (${tiposPresentes.join(", ")}) y extrae los datos estructurados.

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin texto adicional) con estos campos — omite los que no aparezcan en ningún documento:

{
  "empleador": "nombre de la empresa",
  "rutEmpleador": "RUT si aparece",
  "periodo": "mes y año si es una liquidación, ej: 'Marzo 2026'",
  "fechaIngreso": "YYYY-MM-DD",
  "fechaEgreso": "YYYY-MM-DD",
  "contratoTipo": "indefinido" | "plazo_fijo" | "obra_faena",
  "jornadaSemanal": número de horas semanales pactadas (ej: 40, 44, 45),
  "sueldoBase": número en pesos,
  "gratificacion": número en pesos,
  "bonos": número total de bonos fijos mensuales en pesos,
  "movilizacion": número en pesos,
  "colacion": número en pesos,
  "horasExtraMonto": número en pesos (monto de horas extra en la liquidación),
  "totalHaberes": número en pesos,
  "afp": "Capital" | "Cuprum" | "Habitat" | "PlanVital" | "Provida" | "Modelo" | "Uno",
  "prevision": "fonasa" | "isapre",
  "montoIsapre": número en pesos (solo si es Isapre),
  "descuentoAfp": número en pesos,
  "descuentoSalud": número en pesos,
  "totalDescuentos": número en pesos,
  "causal": "159_2" | "159_4" | "159_5" | "160_1a" | "160_1b" | "160_3" | "160_4" | "160_5" | "160_6" | "160_7" | "161_1",
  "fechaCartaAviso": "YYYY-MM-DD",
  "montoFiniquitoFirmado": número en pesos,
  "afcDescontado": número en pesos (AFC ya descontado en el finiquito),
  "liquidoRecibido": número en pesos (monto transferido o líquido a pagar)
}

Guía de causales (Código del Trabajo chileno):
- 159_2 = renuncia voluntaria
- 159_4 = vencimiento del plazo convenido
- 159_5 = conclusión del trabajo, obra o faena
- 160_1a = conducta indebida de carácter grave (Art. 160 N°1, primer párrafo)
- 160_1b = conducta indebida no grave
- 160_3 = inasistencias injustificadas
- 160_4 = abandono del trabajo
- 160_5 = daño material intencional
- 160_6 = injuria grave al empleador o su familia
- 160_7 = incumplimiento grave de obligaciones del contrato
- 161_1 = necesidades de la empresa

Si hay varios documentos, combina la información de todos. Si un valor es ambiguo o no aparece, omite ese campo por completo (no inventes valores). Todos los montos como número entero en pesos chilenos, sin puntos ni símbolos.`;
}
