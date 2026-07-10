# Casos límite legales a verificar — Motor de cálculo de Finiquito

**Calculadora Laboral Chile — Registro de supuestos que requieren validación legal**
Generado: 4 de julio de 2026

---

## Cómo leer este documento

Cada ítem describe: **qué hace hoy el código**, **qué tipo de error puede generar si el supuesto está mal**, y **qué hay que confirmar y con quién**. Ninguno de estos ítems es necesariamente un error — son supuestos que tomé al portar/construir la lógica y que un abogado laboral debería confirmar antes de usar los montos como algo más que una estimación preliminar. Están ordenados por impacto: los críticos afectan el número que ve *todo* usuario; los menores solo casos puntuales.

---

## ✅ Resueltos el 4 de julio de 2026

- **Ítem 1 (nulidad siempre calculada):** corregido. Se agregó `cotizacionesAlDia` a `DatosFiniquito`
  y una pregunta obligatoria en ambos wizards ("¿tu empleador tenía tus cotizaciones al día en la
  fecha del despido?"). `montoNulidad` ahora es $0 salvo que el usuario declare explícitamente que
  no estaban al día (comparación estricta `=== false`, para que un caller que no envíe el campo
  tenga el default seguro de no calcular nulidad). Ver `lib/calculos/calcularFiniquito.ts` paso 6.
  **Nota abierta:** la nulidad se gatea solo por `cotizacionesAlDia`, no por causal — no se verificó
  si legalmente debería excluirse también en 159_2 (renuncia voluntaria), ya que técnicamente ahí no
  hay "despido" del empleador que anular. Confirmar con un abogado.

- **Ítem 3 (falta causal de autodespido):** agregada. `CausalDespidoV2` ahora incluye
  `autodespido_160_1`, `autodespido_160_5` y `autodespido_160_7` (Art. 171 — las únicas 3 causales
  del Art. 160 que la ley permite invocar para autodespido, según fuentes públicas consultadas el
  4-jul-2026: loquetedeben.cl, derechopedia.cl, dt.gob.cl). Dan derecho a indemnización + mes de
  aviso siempre, con recargo fijo de 80% (160_1 o 160_5) o 50% (160_7) — sin depender de
  `causalEsCorrecta`/`tienePruebas`. **Nota abierta:** los porcentajes (80%/50%) vienen de fuentes
  secundarias, no del texto literal del Art. 171 — confirmar con un abogado antes de usarlos como
  cifra definitiva. Ver `lib/calculos/causales.ts`.

- **Ítem 4 (tasas sin confirmar):** actualizado con datos verificados en vivo el 4-jul-2026:
  UTM $71.649 (sii.cl), UF $40.831 (foto del día — cambia a diario, no se actualiza sola), AFP
  Capital corregida a 11,44% (antes 11,27%, estaba desactualizada), AFP Uno actualizada a 10,46%
  desde el 1-may-2026 (antes 10,69%), asignación familiar con tramos de enero-2026 confirmados por
  SUSESO. **Nota abierta:** no se pudo confirmar si ya existe un reajuste de asignación familiar
  vigente desde julio-2026 (la ley reajusta cada 1° de julio) — las fuentes consultadas eran
  contradictorias en ese punto específico. Ver `lib/calculos/vigencias.ts`.

- **Ítem 2 (impuesto sobre exceso de indemnización):** investigado, no requiere cambio de código
  por ahora. El tope no-tributable (Art. 178 CT + Art. 17 N°13 LIR) es "1 mes de remuneración por
  año de servicio", con la base ya topada a 90 UF (Art. 172) — que es exactamente lo que ya calcula
  `lib/calculos/indemnizacion.ts`. El riesgo tributario solo aparecería si se pagara una
  indemnización **convencional** por sobre el mínimo legal, algo que la calculadora no pregunta ni
  modela hoy. Se mantiene como ítem de vigilancia solo si en el futuro se agrega esa funcionalidad.

---

## 🟡 Importantes — afectan causales o situaciones específicas

### 5. AFC empleador pendiente limitado solo a causal 161_1

**Dónde:** `lib/calculos/causales.ts` — `calcularAfcEmpleador`.

**Qué hace hoy:** solo audita si el empleador pagó el 2,4%/3% de AFC cuando la causal es 161_1 (necesidades de la empresa).

**Tipo de error:** el aporte de AFC es una obligación previsional mensual regular (como AFP y salud), no algo exclusivo de una causal — debería poder auditarse para cualquier causal de término, no solo 161_1. Ver la conversación de esta sesión para el detalle de por qué esto importa (conecta con lo que el trabajador después reclama directamente en la AFC al cobrar su seguro de cesantía).

**Qué confirmar:** con un abogado laboral, si hay una razón legal específica para acotar esto a 161_1 dentro del *finiquito*, o si debería ampliarse a todas las causales (recordando que ya existe una auditoría más general e independiente de causal en `auditoriaCotizaciones.ts`, usada en el flujo "Revisar Cotizaciones").

---

### 6. Porcentajes de recargo Art. 168 por sub-causal, sin verificación literal del artículo

**Dónde:** `lib/calculos/causales.ts` — `calcularRecargoArt168`.

**Qué hace hoy (portado de `aplicacion_abogados` sin verificación independiente):**
- 159_4 (vencimiento de plazo mal invocado): 50%
- 160_1a / 160_5 / 160_6: 100%
- 160_1b / 160_3 / 160_4 / 160_7: 80%
- 161_1: 30% fijo

**Tipo de error:** si alguno de estos porcentajes no corresponde exactamente a la letra del Art. 168 para cada numeral del Art. 160, el recargo calculado (que se suma al total, y hoy es visible en el panel admin con cita del %) estaría mal.

**Qué confirmar:** contrastar cada porcentaje contra el texto vigente del Art. 168 del Código del Trabajo, numeral por numeral.

---

### 7. Mes de aviso sustitutivo limitado a causal 161_1

**Dónde:** `lib/calculos/causales.ts` — `calcularMesAvisoSustitutivo`.

**Qué hace hoy:** el mes de aviso previo sustitutivo (Art. 162) solo se calcula para causal 161_1.

**Tipo de error:** en principio esto es correcto (el aviso previo de 30 días es un requisito específico de la causal de necesidades de la empresa), pero vale la pena confirmarlo junto con el ítem 3 (autodespido) — si se agrega esa causal, probablemente también deba tener su propia lógica de aviso previo.

---

## 🟢 Menores — umbrales heurísticos o dependientes de auto-declaración

### 8. Umbrales de evasión de movilización/colación son heurísticas de práctica, no montos legales exactos

**Dónde:** `lib/calculos/calcularFiniquito.ts` (alertas internas de evasión).

**Qué hace hoy:** genera una alerta interna cuando movilización > $25.000 o $50.000, o colación > $30.000. Estos montos son **umbrales de práctica común**, no cifras que el Código del Trabajo fije como límite exacto — la ley solo exige que sean "proporcionales al gasto real".

**Tipo de error:** un caso con movilización real y justificada de, por ejemplo, $55.000 (porque vive lejos) generaría una alerta de "posible evasión" que en realidad no aplica; y un caso con $24.000 de movilización pero claramente desproporcionada al gasto real no generaría ninguna alerta.

**Qué confirmar:** si estos umbrales deberían ajustarse, y dejar explícito en el panel admin que son heurísticas y no una regla legal exacta (ya están marcadas como "ALERTA EVASIÓN" internas, no se muestran al cliente).

---

### 9. Feriado progresivo depende 100% de la auto-declaración del usuario

**Dónde:** `lib/calculos/vacaciones.ts`, input `diasVacacionesAnuales`.

**Qué hace hoy:** el usuario declara directamente cuántos días de vacaciones anuales le corresponden (15 por defecto, más si tiene feriado progresivo). El sistema no calcula automáticamente los días adicionales por antigüedad (Art. 68: 1 día extra cada 3 años, incluyendo antigüedad con empleadores anteriores).

**Tipo de error:** si el usuario no sabe que tiene derecho a feriado progresivo (por ejemplo, por años trabajados en otras empresas antes de esta), va a declarar 15 días cuando le corresponden más — el sistema no tiene forma de detectar esto porque no conoce el historial laboral completo de la persona. Esto es una limitación estructural, no un bug: no hay cómo verificarlo sin pedir el historial previsional completo.

**Qué confirmar:** si vale la pena agregar una pregunta guiada ("¿cuántos años en total llevas trabajando, sumando todos tus empleos?") para al menos sugerir el progresivo en vez de dejarlo enteramente a la memoria del usuario.

---

## Resumen para priorizar

| # | Ítem | Estado | Impacto | Frecuencia |
|---|---|---|---|---|
| 1 | Nulidad sin gate de irregularidad | ✅ Resuelto 4-jul-2026 | Alto (infla el total) | Todos los casos |
| 2 | Impuesto sobre exceso de indemnización | ✅ Investigado, sin acción requerida | — | — |
| 3 | Falta causal de autodespido | ✅ Resuelto 4-jul-2026 (%recargo a confirmar) | Alto (caso no soportado) | Renuncias por falta del empleador |
| 4 | Tasas/topes sin confirmar a la fecha | ✅ Actualizado 4-jul-2026 (asig. familiar jul-2026 pendiente) | Medio | Todos los casos, error pequeño |
| 5 | AFC empleador solo en 161_1 | 🟡 Abierto | Medio | Otras causales con evasión de AFC |
| 6 | % recargo Art. 168 sin verificar | 🟡 Abierto | Medio | Casos con recargo |
| 7 | Mes de aviso solo en 161_1 | 🟡 Abierto (probablemente correcto) | Bajo | — |
| 8 | Umbrales de evasión heurísticos | 🟢 Abierto | Bajo | Casos borde de movilización/colación |
| 9 | Feriado progresivo auto-declarado | 🟢 Abierto (limitación estructural) | Bajo | Trabajadores con antigüedad previa |

**Siguiente prioridad recomendada:** ítem 5 (AFC empleador acotado a 161_1) y 6 (verificar % de
recargo contra el texto literal del Art. 168), idealmente con apoyo de un abogado laboral.
