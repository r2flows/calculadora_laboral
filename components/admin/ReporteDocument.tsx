import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { CAMPO, TIPO_DOC, CAMPO_EXTRAIDO, fmtCLP, fmtFecha, renderValor } from "@/lib/reportes/labels";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  headerTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  headerSub: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  card: { border: "1 solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  subSectionTitle: { fontSize: 7.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginTop: 8, marginBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5 solid #f3f4f6" },
  rowLabel: { color: "#6b7280" },
  rowLabelMuted: { color: "#9ca3af" },
  rowValue: { fontWeight: 500, color: "#1f2937" },
  rowValueBold: { fontWeight: 700, color: "#111827" },
  rowValueNegative: { color: "#dc2626" },
  rowHighlight: { backgroundColor: "#f0fdf4", paddingHorizontal: 6, borderRadius: 4 },
  rowValueHighlight: { fontWeight: 700, color: "#15803d" },
  resultBox: { backgroundColor: "#f0fdf4", border: "1 solid #bbf7d0", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 10 },
  resultLabel: { fontSize: 8, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5 },
  resultValue: { fontSize: 22, fontWeight: 700, color: "#166534", marginTop: 4 },
  alertBox: { border: "1 solid #fecaca", backgroundColor: "#fef2f2", borderRadius: 6, padding: 8, marginBottom: 8 },
  alertBoxTitle: { fontSize: 7.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", marginBottom: 3 },
  alertText: { fontSize: 8, color: "#b91c1c", marginBottom: 2, lineHeight: 1.3 },
  alertFootnote: { fontSize: 6.5, color: "#f87171", marginTop: 3 },
  amberBox: { border: "1 solid #fde68a", backgroundColor: "#fffbeb", borderRadius: 6, padding: 8, marginBottom: 8 },
  amberTitle: { fontSize: 7.5, fontWeight: 700, color: "#b45309", marginBottom: 3 },
  amberText: { fontSize: 8, color: "#b45309", marginBottom: 2 },
  docCard: { border: "1 solid #f3f4f6", borderRadius: 6, padding: 8, marginBottom: 6 },
  docHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  docTitle: { fontSize: 9, fontWeight: 700 },
  docMeta: { fontSize: 7.5, color: "#9ca3af" },
  badge: { fontSize: 7, fontWeight: 700, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 6.5, color: "#9ca3af" },
});

function Row({
  label, value, bold, highlight, negative, muted,
}: { label: string; value: string; bold?: boolean; highlight?: boolean; negative?: boolean; muted?: boolean }) {
  return (
    <View style={[styles.row, highlight ? styles.rowHighlight : {}]}>
      <Text style={bold ? styles.rowValueBold : muted ? styles.rowLabelMuted : styles.rowLabel}>{label}</Text>
      <Text style={
        highlight ? styles.rowValueHighlight
        : negative ? styles.rowValueNegative
        : bold ? styles.rowValueBold
        : muted ? styles.rowLabelMuted
        : styles.rowValue
      }>{value}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.subSectionTitle}>{children}</Text>;
}

interface ClienteInfo {
  nombre: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  estado: string;
  resultado_total: number;
  created_at: string;
}

interface DocumentoInfo {
  id: string;
  tipo: string;
  nombre_archivo: string;
  estado: string;
  datos_extraidos: Record<string, unknown> | null;
  error_mensaje: string | null;
  created_at: string;
}

interface Props {
  cliente: ClienteInfo;
  abogado: { nombre: string } | null;
  datos: Record<string, unknown> | null;
  resultado: Record<string, unknown> | null;
  documentos: DocumentoInfo[];
}

export default function ReporteDocument({ cliente, abogado, datos, resultado, documentos }: Props) {
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const pctFmt = (v: unknown) => `${(n(v) * 100).toFixed(2)}%`;
  const cotiz = (resultado?.cotizacionesUltimosDias as Record<string, number>) ?? {};
  const alertasInternas = Array.isArray(resultado?.alertasInternas) ? (resultado!.alertasInternas as string[]) : [];
  const alertas = Array.isArray(resultado?.alertas) ? (resultado!.alertas as string[]) : [];

  return (
    <Document title={`Reporte — ${cliente.nombre}`}>
      <Page size="A4" style={styles.page}>

        {/* Encabezado */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.headerTitle}>Reporte de auditoría — {cliente.nombre}</Text>
          <Text style={styles.headerSub}>
            Ingresó el {fmtFecha(cliente.created_at)}{abogado ? ` · Abogado: ${abogado.nombre}` : ""}
          </Text>
          <Text style={styles.headerSub}>Generado el {fmtFecha(new Date().toISOString())} · Uso interno</Text>
        </View>

        {/* Contacto */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <Row label="RUT" value={cliente.rut || "—"} />
          <Row label="Email" value={cliente.email || "—"} />
          <Row label="Teléfono" value={cliente.telefono || "—"} />
        </View>

        {/* Resultado */}
        {cliente.resultado_total > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimación de la demanda</Text>
            <Text style={styles.resultValue}>{fmtCLP(cliente.resultado_total)}</Text>
          </View>
        )}

        {/* Alertas internas */}
        {alertasInternas.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertBoxTitle}>Alertas internas — solo admin/abogado, requieren validación legal</Text>
            {alertasInternas.map((a, i) => <Text key={i} style={styles.alertText}>{a}</Text>)}
            <Text style={styles.alertFootnote}>
              Documento de uso interno. Nunca comunicar estas conclusiones al cliente sin que un abogado confirme la causal y las pruebas declaradas.
            </Text>
          </View>
        )}
        {alertas.length > 0 && (
          <View style={styles.amberBox}>
            <Text style={styles.amberTitle}>Alertas (histórico — leads antiguos)</Text>
            {alertas.map((a, i) => <Text key={i} style={styles.amberText}>{a}</Text>)}
          </View>
        )}

        {/* Desglose del cálculo */}
        {resultado && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Desglose del cálculo</Text>

            <SectionTitle>Tiempos y remuneración base</SectionTitle>
            <Row label="Tiempo trabajado" value={`${n(resultado.mesesTrabajados)} meses ${n(resultado.diasTrabajados)} días`} />
            <Row label="· Años de servicio (tope 11)" value={`${n(resultado.anosServicio)} años`} muted />
            <Row label="Tope gratificación mensual (4,75 × IMM / 12)" value={fmtCLP(resultado.topeGratificacionMensual)} muted />
            <Row label="Remuneración imponible mensual" value={fmtCLP(resultado.remuneracionImponibleTotal)} />
            {n(resultado.gratificacionMensual) > 0 && (
              <Row label="· Gratificación mensual incluida" value={fmtCLP(resultado.gratificacionMensual)} muted />
            )}
            <Row label="Valor día (imponible / 30)" value={fmtCLP(resultado.valorDia)} muted />
            <Row label="Tasa AFP aplicada" value={pctFmt(resultado.tasaAfpAplicada)} muted />

            {n(resultado.remUltimosDias) > 0 && (<>
              <SectionTitle>Remuneración últimos días</SectionTitle>
              <Row label="Líquido últimos días" value={fmtCLP(resultado.remUltimosDias)} />
              <Row label="· AFP descontado" value={fmtCLP(cotiz.afp ?? 0)} muted />
              <Row label="· Salud descontado" value={fmtCLP(cotiz.salud ?? 0)} muted />
              <Row label="· AFC descontado" value={fmtCLP(cotiz.afc ?? 0)} muted />
            </>)}

            <SectionTitle>Feriado proporcional</SectionTitle>
            {n(resultado.feriadoProporcionalDiasDescontados) > 0 ? (
              <Row
                label={`${n(resultado.feriadoProporcionalDiasCalculados)} días calc. − ${n(resultado.feriadoProporcionalDiasDescontados)} gozados = ${n(resultado.feriadoProporcionalDias)} días`}
                value={fmtCLP(resultado.feriadoProporcionalMonto)}
              />
            ) : (
              <Row label={`${n(resultado.feriadoProporcionalDias)} días hábiles a pagar`} value={fmtCLP(resultado.feriadoProporcionalMonto)} />
            )}

            <SectionTitle>Indemnización y causal</SectionTitle>
            {n(resultado.montoPorAnoIndemnizacion) > 0 && (
              <Row label="Monto por año (tope 90 UF)" value={fmtCLP(resultado.montoPorAnoIndemnizacion)} muted />
            )}
            {n(resultado.indemnizacionAnosServicio) > 0 && (
              <Row label={`Indemnización años de servicio (${n(resultado.anosServicio)} × monto por año)`} value={fmtCLP(resultado.indemnizacionAnosServicio)} />
            )}
            {n(resultado.indemnizacionAvisoPrevio) > 0 && (
              <Row label="Mes de aviso sustitutivo" value={fmtCLP(resultado.indemnizacionAvisoPrevio)} />
            )}
            {n(resultado.montoRecargoArt168) > 0 && (
              <Row label={`Recargo Art. 168 (${n(resultado.recargoArt168Porcentaje)}%)`} value={fmtCLP(resultado.montoRecargoArt168)} />
            )}
            {n(resultado.afcEmpleadorPendiente) > 0 && (
              <Row label="AFC empleador pendiente" value={fmtCLP(resultado.afcEmpleadorPendiente)} />
            )}
            {n(resultado.asignacionFamiliar) > 0 && (
              <Row label="Asignación familiar (no cotizable)" value={fmtCLP(resultado.asignacionFamiliar)} />
            )}

            {n(resultado.montoHorasExtra) > 0 && (<>
              <SectionTitle>Horas extra</SectionTitle>
              <Row label="Valor hora extra" value={fmtCLP(resultado.valorHoraExtra)} muted />
              <Row label="Monto horas extra" value={fmtCLP(resultado.montoHorasExtra)} />
            </>)}

            <SectionTitle>Impuesto e ítems finales</SectionTitle>
            {!!resultado.tributaImpuesto && (
              <Row label={`(-) Impuesto 2ª cat. (base ${fmtCLP(resultado.baseImpuesto)})`} value={`-${fmtCLP(resultado.impuestoRenta)}`} negative />
            )}
            {n(resultado.anticipoSueldo) > 0 && (
              <Row label="(-) Anticipo de sueldo" value={`-${fmtCLP(resultado.anticipoSueldo)}`} negative />
            )}
            {n(resultado.otrosDescuentos) > 0 && (
              <Row label="(-) Otros descuentos" value={`-${fmtCLP(resultado.otrosDescuentos)}`} negative />
            )}
            <Row label="Total líquido (sin nulidad)" value={fmtCLP(resultado.totalLiquido)} bold />
            <Row label={`Nulidad del despido (${n(resultado.diasNulidad)} días)`} value={fmtCLP(resultado.montoNulidad)} />
            <Row label="TOTAL CON NULIDAD" value={fmtCLP(resultado.totalConNulidad)} bold highlight />

            <SectionTitle>Valores legales vigentes usados en este cálculo</SectionTitle>
            <Row label="IMM vigente" value={fmtCLP(resultado.immVigente)} muted />
            <Row label="UF vigente" value={fmtCLP(resultado.ufVigente)} muted />
            <Row label="UTM vigente" value={fmtCLP(resultado.utmVigente)} muted />
          </View>
        )}

        {/* Datos ingresados */}
        {datos && Object.keys(datos).length > 0 && (
          <View style={styles.card} wrap={false}>
            <Text style={styles.sectionTitle}>Datos ingresados en la calculadora</Text>
            {Object.entries(CAMPO).map(([key, { label, fmt }]) => {
              if (!(key in datos)) return null;
              return <Row key={key} label={label} value={renderValor(datos[key], fmt)} />;
            })}
          </View>
        )}

        {/* Documentos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Documentos ({documentos.length})</Text>
          {documentos.length === 0 ? (
            <Text style={{ color: "#9ca3af" }}>El cliente aún no ha subido documentos.</Text>
          ) : (
            documentos.map((d) => {
              const extraido = d.datos_extraidos as Record<string, unknown> | null;
              return (
                <View key={d.id} style={styles.docCard} wrap={false}>
                  <View style={styles.docHeader}>
                    <View>
                      <Text style={styles.docTitle}>{TIPO_DOC[d.tipo] ?? d.tipo}</Text>
                      <Text style={styles.docMeta}>{d.nombre_archivo} · {fmtFecha(d.created_at)}</Text>
                    </View>
                    <Text style={styles.docMeta}>{d.estado}</Text>
                  </View>
                  {d.error_mensaje && <Text style={{ color: "#dc2626", fontSize: 7.5 }}>{d.error_mensaje}</Text>}
                  {extraido && Object.entries(CAMPO_EXTRAIDO).map(([key, { label, fmt }]) => {
                    const v = extraido[key];
                    if (v === null || v === undefined) return null;
                    return (
                      <Row
                        key={key}
                        label={label}
                        value={fmt === "currency" ? fmtCLP(v) : fmt === "date" ? fmtFecha(v) : String(v)}
                      />
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.footer} fixed>
          Documento de uso interno — no reenviar directamente al cliente sin validación de un abogado.
        </Text>
      </Page>
    </Document>
  );
}
