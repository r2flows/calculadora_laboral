import { CAUSALES_V2 } from "./causales";

/**
 * Labels del enum de causales LEGADO (art159_x, art160, art161, art161a, autodespido).
 * Solo para mostrar `datos_calculo` histórico ya guardado en Supabase antes de esta
 * migración al modelo granular (CausalDespidoV2). El motor de cálculo actual ya no
 * produce estos valores — ver lib/calculos/tipos.ts (CausalDespidoLegado).
 */
const CAUSALES_LEGADO: Record<string, string> = {
  art159_1: "Art. 159 N°1 — Mutuo acuerdo",
  art159_2: "Art. 159 N°2 — Vencimiento de plazo",
  art159_3: "Art. 159 N°3 — Conclusión del trabajo",
  art159_4: "Art. 159 N°4 — Caso fortuito",
  art159_5: "Art. 159 N°5 — Renuncia voluntaria",
  art159_6: "Art. 159 N°6 — Muerte del trabajador",
  art160: "Art. 160 — Causal grave (sin indemnización)",
  art161: "Art. 161 — Necesidades de la empresa",
  art161a: "Art. 161a — Desahucio",
  autodespido: "Autodespido / Despido indirecto",
};

/**
 * Devuelve la etiqueta legible de una causal ya guardada en Supabase, sea del enum
 * legado o del modelo granular vigente (159_2, 160_1a, 161_1, etc.). No traduce entre
 * ambos formatos — cada causal se etiqueta con su propio diccionario, porque el enum
 * legado es más genérico y no hay forma de reconstruir la sub-causal exacta con la que
 * se guardó un lead antiguo. Si no coincide con ninguno, retorna el valor crudo.
 */
export function labelCausal(causal: unknown): string {
  const key = String(causal ?? "");
  if (!key) return "—";
  return CAUSALES_LEGADO[key] ?? CAUSALES_V2[key as keyof typeof CAUSALES_V2]?.label ?? key;
}
