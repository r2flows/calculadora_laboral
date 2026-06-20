Para calcular correctamente las vacaciones proporcionales en Chile, debe considerarse no sólo los meses trabajados, sino también los días efectivamente trabajados. Además, si el trabajador tiene feriado progresivo, éste debe incorporarse al cálculo.

El procedimiento es el siguiente:

Se determina la cantidad de días de feriado anual que corresponden al trabajador:
15 días hábiles como regla general.
O más días, si tiene feriado progresivo.
Se calcula el factor mensual dividiendo los días de vacaciones por 12 meses.

Ejemplo sin feriado progresivo:

15:12
​

=1,25

Esto significa que el trabajador genera 1,25 días hábiles de vacaciones por cada mes trabajado.

Luego, se calcula el factor diario dividiendo nuevamente por 30 días.

Ejemplo:

15:12:30

​

=0,04167

Ese factor corresponde a los días de vacaciones generados por cada día trabajado.

Si el trabajador tiene feriado progresivo, el cálculo cambia según la cantidad total de días de vacaciones anuales.

Ejemplo con 16 días de feriado anual:

Factor mensual:

16:12
​

=1,3333

Factor diario:

(16:12)×30

​

=0,04444

Después, se calcula:
meses trabajados × factor mensual;
más días trabajados × factor diario.

Ejemplo:
Si trabajó 7 meses y 12 días, sin feriado progresivo:

(7×1,25)+(12×0,04167)=9,25004

El resultado final debe truncarse a 2 decimales.

En el ejemplo anterior:

9,25004→9,25

Por lo tanto, corresponderían 9,25 días hábiles de feriado proporcional.

Finalmente, esos días hábiles deben proyectarse en el calendario desde el día siguiente al término del contrato, incorporando sábados, domingos y festivos comprendidos en el período. El total de días corridos resultante es el que debe pagarse conforme al valor diario de la remuneración del trabajador.

---

REGLAS GENERALES DE CONTEO

Sumar desde el día de inicio del trabajo hasta el término incluidos ambos para efectos de conteo. Tanto de cotizaciones como días trabajados, y todos los demás ítems.

CORRECCIÓN DE CONTEO: En el cálculo del finiquito, el conteo de días del mes en curso debe incluir el día del despido (falta uno que se estaba omitiendo). Lo mismo aplica para el cálculo de la nulidad: contar desde el día siguiente al despido incluido hasta la fecha de consulta también incluida, sin omitir ningún día.

---

FINIQUITO — PREGUNTAS PREVIAS AL CÁLCULO

Hacer pregunta al cliente antes de calcular el finiquito: ¿Ya le cancelaron la remuneración adeudada de los días trabajados el mes que fue despedido?

Si la respuesta es SÍ: en el cálculo del finiquito no incluir la remuneración de los últimos días del mes trabajado.

Si la respuesta es NO: agregar el pago de los últimos días trabajados en el mes, todos incluidos desde el día 1 del mes hasta el día del despido que se ha producido ese mismo mes, y en base a este número calcular el descuento en salud (Fonasa o Isapre según la que tenga), AFP y AFC.

---

LIQUIDACIÓN — PREGUNTAS

¿Recibió un anticipo de sueldo?
Sí o No.
Si la respuesta es Sí: preguntar cuánto y dar ítem para completar, y restar al valor líquido final que se debería pagar en la liquidación.

¿Tuvo otros descuentos en el mes?
Sí o No.
Si la respuesta es Sí: preguntar cuánto y dar ítem para completar, y restar al valor líquido final que se debería pagar en la liquidación.

¿Recibe asignación familiar?
Sí o No.
Si recibe: enlazar la tabla según corresponda con el rango de sueldo, y sumar al valor líquido final. Este valor no es cotizable, ni tampoco se usa para efectos de calcular valor día o feriado proporcional.

Si hay montos que agregar en todos los ítems anteriores, incluir la instrucción de que se agreguen los montos unidos por un signo más (la IA reconoce valores entre los signos más y los suma).

---

HORAS EXTRA — MINUTOS

Agregar ítem de minutos en el cálculo de horas extra en forma permanente mensual (finiquito) después de la pregunta "¿hace minutos extra en forma permanente mensual?".

También incluir ítem de minutos si hizo horas extra en ese mes, para el cálculo de la liquidación.

El cálculo del minuto extra es el valor de la hora extra dividido en 60.

---

VISUALIZACIÓN — CLIENTE VS ADMINISTRADOR

Al cliente: no mostrar el desglose de montos, solo lo que le falta. En caso de finiquito, mostrar solo el número total que podría ganar (considerando nulidad).

Al administrador: mostrar el detalle minucioso de todo lo calculado.

Para activar el modo administrador: preguntar al inicio "¿Eres administrador?". Si responde Sí, solicitar el código de administración; al reconocerlo como válido, lanzar el detalle minucioso de todo lo calculado.

En caso de finiquito: avisar internamente al administrador si lo que sale pagado en liquidación no coincide con lo que se le debería pagar por estos ítems, con desglose exhaustivo.

Al cliente: lanzar solo una alarma genérica "hay error en los pagos" y al final el monto total a favor.

---

MOVILIZACIÓN Y COLACIÓN

Si el monto de movilización supera los $25.000: preguntar:
¿Para ir a trabajar debes viajar a otra región?
¿La empresa paga tus pasajes?
Sí o No. Si la respuesta es Sí: enviar aviso de que podría haber evasión de cotizaciones.
Si el monto supera los $50.000: enviar mensaje de advertencia de que podría existir evasión de cotizaciones.

Si el ítem de colación supera los $30.000: enviar advertencia de que podría existir evasión de cotizaciones.

BONOS NO COTIZABLES Y NO IMPONIBLES

Si hay bonos no cotizables que no corresponden a movilización ni a colación: enviar mensaje al cliente advirtiendo que podría existir evasión de cotizaciones.

Si la empresa indica que esos bonos no son cotizables pero no justifica la razón: avisar por interno al administrador que podría haber evasión de cotizaciones.

Si hay bonos no imponibles: enviar advertencia interna al administrador de que podría existir evasión de cotizaciones.

---

INTERACCIÓN CON CLIENTE — AGENTE CONVERSACIONAL

CONTRATO DE TRABAJO

Preguntar al cliente: ¿Tiene contrato de trabajo firmado?

Si la respuesta es NO: informar que podría haber causal de nulidad del despido y avisar internamente al administrador.

Si la respuesta es SÍ: preguntar si la fecha de inicio que figura en el contrato coincide con el primer día que efectivamente fue a trabajar.
Si NO coincide: informar que podría haber causal de nulidad del despido y avisar internamente al administrador.

Nota legal: la ley otorga dos semanas al empleador para escriturar el contrato, pero este debe contener como fecha de inicio el primer día en que el trabajador ingresó a trabajar. Esa fecha debe considerarse para todos los cálculos de la liquidación y el finiquito.

COTIZACIONES Y PAGOS INFORMALES

Preguntar: ¿Le cotizaron los días trabajados desde el primer día?
Si la respuesta es NO: registrar como posible causal de nulidad y avisar internamente al administrador.

Preguntar: ¿Le han pagado días trabajados o horas extra en efectivo o por transferencia, sin que aparezcan en la liquidación?
Si la respuesta es SÍ: avisar internamente al administrador que podría existir evasión de cotizaciones y/o nulidad del despido.

AUTODESPIDO

Informar al cliente que existe la figura del autodespido (despido indirecto): el trabajador puede poner término al contrato invocando causales imputables al empleador y exigir indemnizaciones.

Preguntar: ¿El empleador ha incurrido en alguna de las siguientes conductas?
- No pago o pago parcial de remuneraciones
- No pago de cotizaciones previsionales
- Conductas de acoso laboral o sexual
- Incumplimiento grave de las obligaciones del contrato

Si el cliente confirma alguna de estas causales: informar que podría tener derecho a autodespedirse con derecho a indemnización, y avisar internamente al administrador con el detalle de la causal indicada.

---

GARANTÍAS DEL CLIENTE

Servicio de Acompañamiento, el que incluye:

1. Asistente Legal Personal: La Empresa asignará al Cliente un Asistente Legal, quien a solicitud de éste y en beneficio de éste, actuará como canal principal de apoyo administrativo y orientación general desde el inicio hasta el cierre de la causa. Sus funciones comprenderán, entre otras:
A) Realizar las gestiones que se necesiten para el correcto desarrollo de la causa.
B) Acompañar y/o asistir al cliente en las gestiones en las que deba comparecer personalmente, para su correcta y oportuna obtención.
C) Recibir antecedentes y gestionar la recopilación de documentación.
D) Atender inquietudes generales del Cliente.
E) Canalizar consultas hacia el área correspondiente.
F) Coordinar reuniones cuando proceda.
G) Informar avances relevantes.
H) Asistir en requerimientos propios de la tramitación.

2. Monitoreo de la Causa: La Empresa mantendrá seguimiento continuo del estado procesal y administrativo de la causa, con el objeto de detectar oportunamente:
- Observaciones
- Trabas administrativas
- Faltas de documentos
- Requerimientos del tribunal
- Incidencias procesales
- Oportunidades de gestión útil
Lo anterior tiene por finalidad adoptar con rapidez las medidas necesarias para favorecer la continuidad y correcta tramitación del procedimiento.

3. Seguro Gratuito de Cambio de Profesional: Si durante la prestación del servicio se generare una situación seria de descontento no resuelta razonablemente entre las partes, la Empresa podrá, a su sola evaluación interna y sin costo adicional para el Cliente, reasignar la atención profesional a otro abogado o profesional disponible que preste servicios a ésta. Esta medida busca resguardar la continuidad del servicio y la satisfacción del Cliente.
