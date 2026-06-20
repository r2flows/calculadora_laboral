# Algoritmo de Cálculo de Finiquito Laboral
**Calculadora Laboral Chile — Documentación Técnica**
Versión actual: junio 2025

---

## Índice

1. [Principios generales de conteo](#1-principios-generales-de-conteo)
2. [Remuneración imponible](#2-remuneración-imponible)
3. [Cotizaciones previsionales](#3-cotizaciones-previsionales)
4. [Remuneración de últimos días](#4-remuneración-de-últimos-días)
5. [Feriado proporcional](#5-feriado-proporcional)
6. [Indemnizaciones](#6-indemnizaciones)
7. [Nulidad del despido](#7-nulidad-del-despido)
8. [Horas y minutos extra](#8-horas-y-minutos-extra)
9. [Impuesto de segunda categoría](#9-impuesto-de-segunda-categoría)
10. [Descuentos y beneficios adicionales](#10-descuentos-y-beneficios-adicionales)
11. [Estructura del total final](#11-estructura-del-total-final)
12. [Alertas de evasión de cotizaciones](#12-alertas-de-evasión-de-cotizaciones)
13. [Tabla de causales de término](#13-tabla-de-causales-de-término)

---

## 1. Principios generales de conteo

### Regla de extremos incluidos
Todo conteo de días y meses incluye **ambos extremos**: el día de inicio del contrato y el día del despido. Esta regla aplica a todos los ítems: cotizaciones, días trabajados, feriado proporcional y remuneraciones.

### Algoritmo de meses y días (`conteo.ts`)

El conteo se hace comparando año/mes/día en UTC para evitar desfases de zona horaria (el servidor opera en UTC-4, Chile).

```
meses = (año_fin - año_inicio) × 12 + (mes_fin - mes_inicio)
Si día_fin < día_inicio → meses = meses - 1

cursor = fecha_inicio + meses completos (mismo día del mes)
días_residuales = (fecha_fin - cursor) en días + 1  [ambos incluidos]
```

**Ejemplo:** Inicio 2023-01-01, Término 2023-08-12
- meses = 7 (enero a julio completos; cursor = 2023-08-01)
- días residuales = 12 (agosto 1 al 12, ambos incluidos)
- Resultado: 7 meses 12 días

> **Corrección implementada:** El día del despido estaba siendo omitido en versiones anteriores. El algoritmo actual siempre lo incluye mediante `+1` al contar el residuo.

---

## 2. Remuneración imponible

La remuneración imponible es la base de cálculo para cotizaciones, valor día, feriado proporcional e indemnizaciones.

```
Remuneración imponible = Sueldo base + Gratificación mensual
```

### Gratificación mensual legal (Art. 50 CT)

La gratificación mensual es **remuneración imponible**. Se calcula como:

```
Gratificación = mín(Sueldo base × 25%,  4,75 × IMM ÷ 12)
```

Donde IMM 2025 = $510.000 y el tope mensual es:

```
Tope = 4,75 × 510.000 ÷ 12 = $201.875
```

Si la empresa paga un monto fijo distinto al legal, ese valor reemplaza al cálculo automático.

**Nota:** La movilización y la colación **no son imponibles** y no entran en la base para cotizaciones ni para el valor día. Sí se incluyen en la base de indemnización (ver sección 6).

---

## 3. Cotizaciones previsionales

Se descuentan sobre la remuneración imponible total (sueldo + gratificación).

| Concepto | Tasa | Observaciones |
|----------|------|---------------|
| AFP Capital | 11,27% | Tasa trabajador, excluye SIS |
| AFP Cuprum | 11,44% | |
| AFP Habitat | 11,27% | |
| AFP Modelo | 10,58% | |
| AFP PlanVital | 11,16% | |
| AFP Provida | 11,45% | |
| AFP Uno | 10,69% | |
| Fonasa | 7,00% | Sobre renta imponible |
| Isapre | Monto pactado | Valor fijo mensual declarado |
| AFC (trabajador) | 0,60% | Seguro de Cesantía, contrato indefinido |

```
Descuento AFP    = Remuneración imponible × tasa AFP
Descuento Salud  = Remuneración imponible × 7%  (Fonasa)
                   ó monto pactado              (Isapre)
Descuento AFC    = Remuneración imponible × 0,6%
Total cotizaciones = AFP + Salud + AFC
```

---

## 4. Remuneración de últimos días

Se aplica **solo si el empleador no canceló la remuneración del mes del despido**.

### Días a calcular
Desde el **día 1 del mes** hasta el **día del despido**, ambos incluidos:

```
Días mes en curso = día del despido  (ej: si el despido es el 18, son 18 días)
```

### Cálculo del monto bruto
```
Monto bruto = (Remuneración imponible ÷ días del mes) × días trabajados
```

Se aplican las cotizaciones correspondientes (AFP + Salud + AFC) sobre ese monto proporcional:

```
Monto líquido = Monto bruto − cotizaciones proporcionales
```

---

## 5. Feriado proporcional

### Días de vacaciones anuales
- Regla general: **15 días hábiles**
- Con feriado progresivo: el número que corresponda según años en la empresa (16, 17, 18... días)

### Factor de acumulación

```
Factor mensual = Días vacaciones anuales ÷ 12
Factor diario  = Factor mensual ÷ 30

Feriado calculado = (meses × factor mensual) + (días × factor diario)
```

El resultado se **trunca** a 2 decimales (no se redondea).

**Ejemplo de la documentación:** 7 meses 12 días, sin progresivo
```
Factor mensual = 15 ÷ 12 = 1,25
Factor diario  = 1,25 ÷ 30 = 0,04167
Feriado = (7 × 1,25) + (12 × 0,04167) = 8,75 + 0,50004 = 9,25004 → 9,25 días hábiles
```

### Descuento de vacaciones ya gozadas

Si el trabajador tomó vacaciones durante el contrato:
```
Feriado a pagar = máx(0,  feriado calculado − días hábiles ya gozados)
```

### Proyección en días corridos

Los días hábiles se proyectan en el calendario desde el día siguiente al término del contrato, contando **todos los días** (lunes a domingo). La proyección avanza día a día en el calendario hasta completar los días hábiles (lunes a viernes), contando los días corridos totales transcurridos.

```
Monto feriado = Valor día × días corridos proyectados

Valor día = Remuneración imponible ÷ 30
```

---

## 6. Indemnizaciones

La base de cálculo para indemnizaciones incluye movilización y colación (Art. 172 CT):

```
Base indemnización = Remuneración imponible + Movilización + Colación
```

### Indemnización por años de servicio

Aplica en causales: **Art. 161** (necesidades de la empresa), **Art. 161a** (desahucio) y **Autodespido**.

```
Años completos    = meses trabajados ÷ 12  (parte entera)
Fracción ≥ 6 meses → se cuenta como 1 año adicional
Años con tope     = mín(años, 11)

Indemnización años = años con tope × base indemnización
```

### Indemnización sustitutiva de aviso previo

Aplica en causales: **Art. 161** y **Art. 161a**.

```
Indemnización aviso previo = 1 mes de base indemnización
```

### Causales sin derecho a indemnización

| Causal | Aviso previo | Años servicio |
|--------|-------------|---------------|
| Renuncia voluntaria (Art. 159 N°5) | No | No |
| Mutuo acuerdo (Art. 159 N°1) | No | No |
| Vencimiento de plazo (Art. 159 N°2) | No | No |
| Falta grave (Art. 160) | No | No |
| Necesidades empresa (Art. 161) | Sí | Sí |
| Desahucio (Art. 161a) | Sí | Sí |
| Autodespido | No | Sí |

---

## 7. Nulidad del despido

La nulidad corresponde a las remuneraciones devengadas desde el día siguiente al despido hasta la fecha en que se ejerce la acción.

### Conteo de días
```
Inicio conteo = día del despido + 1  [inclusive]
Fin conteo    = fecha de consulta    [inclusive]

Días nulidad = (fecha consulta − día siguiente al despido) en días + 1
```

**Ejemplo:** Despido el 18 de junio, consulta el 20 de junio
```
Inicio = 19 de junio
Fin    = 20 de junio
Días   = (20 − 19) + 1 = 2 días
```

### Monto de nulidad
```
Monto nulidad = Valor día × días de nulidad
Valor día     = Remuneración imponible ÷ 30
```

> La nulidad se suma al total líquido para obtener el monto total que el trabajador puede reclamar a la fecha de consulta.

---

## 8. Horas y minutos extra

Se considera el valor de la hora extra con recargo legal del 50%:

```
Valor hora extra = (Remuneración imponible ÷ 30 ÷ 8) × 1,5

Monto horas extra = valor hora extra × horas extra permanentes
                  + (valor hora extra ÷ 60) × minutos extra permanentes
```

La base es la remuneración imponible total (sueldo + gratificación), no solo el sueldo base.

---

## 9. Impuesto de segunda categoría

Se aplica **automáticamente** si la remuneración imponible mensual supera los **13,5 UTM**.

Con UTM 2025 = $67.294:
```
Umbral = 13,5 × $67.294 = $908.469 mensuales
```

### Tabla progresiva (SII Chile 2025)

| Desde (UTM) | Hasta (UTM) | Tasa | Deducción (UTM) |
|-------------|-------------|------|-----------------|
| 0 | 13,5 | 0% | 0 |
| 13,5 | 30 | 4% | 0,54 |
| 30 | 50 | 8% | 1,74 |
| 50 | 70 | 13,5% | 4,49 |
| 70 | 90 | 23% | 11,14 |
| 90 | 120 | 30,4% | 17,80 |
| 120 | 150 | 35% | 23,32 |
| 150 | ∞ | 40% | 30,82 |

### Fórmula de cálculo

```
Impuesto = (Base imponible × tasa del tramo) − (deducción en UTM × UTM)
```

La deducción en pesos elimina el efecto escalón entre tramos, haciendo el impuesto efectivamente progresivo.

**Ejemplo:** Remuneración imponible $1.200.000 (≈ 17,8 UTM → tramo 4%)
```
Impuesto = $1.200.000 × 0,04 − 0,54 × $67.294
         = $48.000 − $36.339
         = $11.661
```

---

## 10. Descuentos y beneficios adicionales

### Descuentos que reducen el total líquido
- **Anticipo de sueldo:** monto declarado por el trabajador
- **Otros descuentos del mes:** préstamos, descuentos pactados, etc.
- **Impuesto segunda categoría:** si la renta imponible supera 13,5 UTM

### Asignación familiar
- No es remuneración imponible
- No se usa para calcular valor día ni feriado proporcional
- **Sí se suma** al total bruto del finiquito
- Monto según tabla de tramos por ingreso (SII):

| Ingreso mensual hasta | Monto por carga |
|----------------------|-----------------|
| $390.255 | $16.899 |
| $569.646 | $10.368 |
| $882.589 | $3.276 |
| Más de $882.589 | $0 |

---

## 11. Estructura del total final

```
TOTAL BRUTO
  + Remuneración últimos días (líquido, si no fue pagada)
  + Feriado proporcional
  + Indemnización aviso previo
  + Indemnización años de servicio
  + Horas/minutos extra permanentes
  + Asignación familiar

DESCUENTOS
  − Impuesto segunda categoría (si aplica)
  − Anticipo de sueldo
  − Otros descuentos del mes

= TOTAL LÍQUIDO

  + Nulidad del despido

= TOTAL CON NULIDAD  ← monto que puede reclamarse a la fecha de consulta
```

---

## 12. Alertas de evasión de cotizaciones

El sistema genera alertas internas visibles **solo para el administrador**:

| Condición | Tipo de alerta |
|-----------|---------------|
| Movilización > $50.000 | ALERTA: posible evasión de cotizaciones |
| Movilización > $25.000 + viaja a otra región + empresa paga pasajes | AVISO: posible evasión |
| Movilización > $25.000 + no viaja a otra región | AVISO: revisar cotizabilidad |
| Colación > $30.000 | ALERTA: posible evasión |
| Bono declarado como no cotizable | ALERTA: revisar evasión |

El cliente solo recibe un mensaje genérico en caso de discrepancia; nunca ve el detalle de las alertas.

---

## 13. Tabla de causales de término

| Código | Descripción | Indemnización años | Aviso previo |
|--------|-------------|-------------------|--------------|
| `art159_1` | Mutuo acuerdo | No | No |
| `art159_2` | Vencimiento de plazo | No | No |
| `art159_3` | Conclusión del trabajo | No | No |
| `art159_4` | Caso fortuito | No | No |
| `art159_5` | Renuncia voluntaria | No | No |
| `art159_6` | Muerte del trabajador | No | No |
| `art160` | Falta grave (caducidad) | No | No |
| `art161` | Necesidades de la empresa | Sí (tope 11 años) | Sí (1 mes) |
| `art161a` | Desahucio | Sí (tope 11 años) | Sí (1 mes) |
| `autodespido` | Autodespido (despido indirecto) | Sí (tope 11 años) | No |

---

*Documento generado en base al código fuente de `lib/calculos/`. Ante cualquier modificación al algoritmo, este documento debe actualizarse en forma paralela.*
