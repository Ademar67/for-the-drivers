import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";

/* ================= TYPES ================= */

export type ComboPdfItem = {
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  precioUnitario: number;
  subtotalCosto: number;
  subtotalPrecio: number;
  subtotalComision: number;
  subtotalUtilidadNeta: number;
};

export type ComboPdfData = {
  agenciaNombre: string;
  comboNombre: string;
  ventasMes: number;
  piezasTotalesCombo: number;
  costoTotal: number;
  precioTotal: number;
  utilidadTotal: number;
  utilidadNetaCombo: number;
  comisionTotalCombo: number;
  utilidadMensualAgencia: number;
  comisionMensualAsesor: number;
  ticketPromedio: number;
  margenBrutoPct: number;
  observaciones?: string;
  generatedAt: Date;
  items: ComboPdfItem[];
};

/* ================= CONFIG ================= */

const LOGO_SRC = "/liquimoly-logo-v4.png";

const COLORS = {
  navy: "#0f172a",
  blue: "#0033A0",
  blueSoft: "#EAF1FF",
  green: "#15803d",
  greenSoft: "#ECFDF3",
  amber: "#B45309",
  amberSoft: "#FFF7ED",
  slate: "#475569",
  slateSoft: "#F8FAFC",
  border: "#E2E8F0",
  white: "#FFFFFF",
  darkLine: "#CBD5E1",
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 26,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },

  header: {
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.blue,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  logoWrap: {
    width: 200,
    minHeight: 64,
    justifyContent: "center",
  },
  logo: {
    width: 190,
    height: 60,
    objectFit: "contain",
  },
  headerRight: {
    flexGrow: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.blue,
    textAlign: "right",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.slate,
    textAlign: "right",
  },
  impactWrap: {
    marginTop: 8,
    backgroundColor: COLORS.blueSoft,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  impactText: {
    fontSize: 9,
    color: COLORS.blue,
    fontWeight: "bold",
  },

  heroBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.slateSoft,
    padding: 12,
  },
  heroLine: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 4,
  },
  heroSubline: {
    fontSize: 9.5,
    color: COLORS.slate,
    lineHeight: 1.4,
  },

  gainBox: {
    marginTop: 12,
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  gainText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.blue,
    textAlign: "center",
  },

  agencyCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    padding: 12,
  },
  agencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  agencyField: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 8.5,
    color: COLORS.slate,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: "bold",
  },

  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 8,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  kpiCard: {
    width: "25%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  kpiInner: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    minHeight: 66,
  },
  kpiBlue: {
    backgroundColor: COLORS.blueSoft,
  },
  kpiGreen: {
    backgroundColor: COLORS.greenSoft,
  },
  kpiAmber: {
    backgroundColor: COLORS.amberSoft,
  },
  kpiDefault: {
    backgroundColor: COLORS.white,
  },
  kpiLabel: {
    fontSize: 8.5,
    color: COLORS.slate,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.navy,
  },
  kpiValueBlue: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.blue,
  },
  kpiValueGreen: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.green,
  },
  kpiValueAmber: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.amber,
  },

  impactBar: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.blueSoft,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  impactBarText: {
    fontSize: 9.5,
    color: COLORS.blue,
    fontWeight: "bold",
    textAlign: "center",
  },

  packageCardList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  packageCard: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  packageCardFirst: {
    borderTopWidth: 0,
  },
  packageTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 3,
  },
  packageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  packageLabel: {
    fontSize: 8.5,
    color: COLORS.slate,
  },
  packageValue: {
    fontSize: 8.5,
    color: COLORS.navy,
    fontWeight: "bold",
  },
  packageProfit: {
    fontSize: 9,
    color: COLORS.green,
    fontWeight: "bold",
    marginTop: 4,
  },

  readingBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.slateSoft,
    padding: 12,
  },
  paragraph: {
    fontSize: 9.8,
    lineHeight: 1.5,
    color: "#334155",
  },
  strong: {
    fontWeight: "bold",
    color: COLORS.navy,
  },

  observationsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  observationsText: {
    fontSize: 9.3,
    lineHeight: 1.45,
    color: COLORS.slate,
  },

  recommendationBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 9.3,
    lineHeight: 1.45,
    color: COLORS.slate,
  },

  closeBar: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.blueSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  closeBarText: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: "bold",
  },

  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkLine,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.slate,
    textAlign: "center",
    lineHeight: 1.4,
  },
});

/* ================= HELPERS ================= */

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(date: Date) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function safeDate(date: Date | string | undefined) {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function sanitizeWhatsappText(text: string) {
  return encodeURIComponent(text);
}

function buildPdfFileName(fileName?: string) {
  return fileName?.trim() || "propuesta-rentabilidad-liqui-moly.pdf";
}

function pluralizePaquete(value: number) {
  return `${value} paquete${value === 1 ? "" : "s"}`;
}

function shortenName(name: string, max = 50) {
  if (!name) return "";
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/* ================= DOCUMENT ================= */

function ComboPDFDocument({ data }: { data: ComboPdfData }) {
  const generatedAt = safeDate(data.generatedAt);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrap}>
              <Image src={LOGO_SRC} style={styles.logo} />
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.title}>Propuesta de rentabilidad mensual</Text>
              <Text style={styles.subtitle}>
                Modelo comercial de alto margen por servicio
              </Text>

              <View style={styles.impactWrap}>
                <Text style={styles.impactText}>
                  Estrategia para incrementar ticket promedio y utilidad sin competir por precio
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.heroBox}>
          <Text style={styles.heroLine}>
            Modelo diseñado para aumentar ingresos sin sacrificar margen.
          </Text>
          <Text style={styles.heroSubline}>
            Esta propuesta muestra el potencial real de ingresos, utilidad y comisiones
            al estructurar la venta por paquetes, facilitando el cierre y aumentando la
            rentabilidad de la operación.
          </Text>
        </View>

        {/* IMPACTO FUERTE */}
        <View style={styles.gainBox}>
          <Text style={styles.gainText}>
            Este modelo puede generar {money(data.utilidadNetaCombo)} mensuales de utilidad.
          </Text>
        </View>

        {/* DATOS */}
        <View style={styles.agencyCard}>
          <View style={styles.agencyGrid}>
            <View style={styles.agencyField}>
              <Text style={styles.label}>Agencia</Text>
              <Text style={styles.value}>{data.agenciaNombre || "Agencia objetivo"}</Text>
            </View>

            <View style={styles.agencyField}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>{formatDate(generatedAt)}</Text>
            </View>

            <View style={styles.agencyField}>
              <Text style={styles.label}>Propuesta</Text>
              <Text style={styles.value}>
                {data.comboNombre || "Escenario comercial mensual"}
              </Text>
            </View>

            <View style={styles.agencyField}>
              <Text style={styles.label}>Enfoque</Text>
              <Text style={styles.value}>Rentabilidad por paquete</Text>
            </View>
          </View>
        </View>

        {/* RESUMEN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen mensual estimado</Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiBlue]}>
                <Text style={styles.kpiLabel}>Venta mensual</Text>
                <Text style={styles.kpiValueBlue}>{money(data.precioTotal)}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiAmber]}>
                <Text style={styles.kpiLabel}>Costo mensual</Text>
                <Text style={styles.kpiValueAmber}>{money(data.costoTotal)}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiGreen]}>
                <Text style={styles.kpiLabel}>Utilidad neta mensual</Text>
                <Text style={styles.kpiValueGreen}>{money(data.utilidadNetaCombo)}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiDefault]}>
                <Text style={styles.kpiLabel}>Comisión mensual asesor</Text>
                <Text style={styles.kpiValue}>{money(data.comisionMensualAsesor)}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiDefault]}>
                <Text style={styles.kpiLabel}>Utilidad bruta mensual</Text>
                <Text style={styles.kpiValue}>{money(data.utilidadTotal)}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiDefault]}>
                <Text style={styles.kpiLabel}>Margen bruto</Text>
                <Text style={styles.kpiValue}>
                  {(data.margenBrutoPct || 0).toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiDefault]}>
                <Text style={styles.kpiLabel}>Paquetes al mes</Text>
                <Text style={styles.kpiValue}>{data.ventasMes || 0}</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiInner, styles.kpiDefault]}>
                <Text style={styles.kpiLabel}>Ticket promedio</Text>
                <Text style={styles.kpiValue}>{money(data.ticketPromedio)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.impactBar}>
            <Text style={styles.impactBarText}>
              Propuesta enfocada en utilidad, no en volumen.
            </Text>
          </View>
        </View>

        {/* DETALLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de paquetes</Text>

          <View style={styles.packageCardList}>
            {data.items.map((item, index) => (
              <View
                key={`${item.nombre}-${index}`}
                style={[
                  styles.packageCard,
                  index === 0 ? styles.packageCardFirst : null,
                ]}
              >
                <Text style={styles.packageTitle}>
                  {shortenName(item.nombre, 56)}
                </Text>

                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Paquetes/mes</Text>
                  <Text style={styles.packageValue}>{item.cantidad}</Text>
                </View>

                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Costo unitario</Text>
                  <Text style={styles.packageValue}>{money(item.costoUnitario)}</Text>
                </View>

                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Precio unitario</Text>
                  <Text style={styles.packageValue}>{money(item.precioUnitario)}</Text>
                </View>

                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Venta mensual</Text>
                  <Text style={styles.packageValue}>{money(item.subtotalPrecio)}</Text>
                </View>

                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Comisión mensual</Text>
                  <Text style={styles.packageValue}>{money(item.subtotalComision)}</Text>
                </View>

                <Text style={styles.packageProfit}>
                  Utilidad neta: {money(item.subtotalUtilidadNeta)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* LECTURA */}
        <View style={styles.readingBox}>
          <Text style={styles.sectionTitle}>Lectura comercial</Text>
          <Text style={styles.paragraph}>
            Si la agencia implementa este modelo con{" "}
            <Text style={styles.strong}>
              {pluralizePaquete(data.ventasMes || 0)}
            </Text>{" "}
            mensuales, puede generar ingresos por{" "}
            <Text style={styles.strong}>{money(data.precioTotal)}</Text> y una
            utilidad aproximada de{" "}
            <Text style={styles.strong}>{money(data.utilidadNetaCombo)}</Text>.
            {"\n\n"}
            Esto permite dejar de competir por precio y comenzar a operar con un
            modelo enfocado en rentabilidad.
          </Text>
        </View>

        {/* OBSERVACIONES */}
        <View style={styles.observationsBox}>
          <Text style={styles.sectionTitle}>Observaciones comerciales</Text>
          <Text style={styles.observationsText}>
            {data.observaciones?.trim() ||
              "Modelo comercial diseñado para incrementar ingresos, mejorar margen y facilitar el cierre de servicios de mayor valor para el cliente final."}
          </Text>
        </View>

        {/* RECOMENDACIÓN */}
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationTitle}>Recomendación</Text>
          <Text style={styles.recommendationText}>
            Se recomienda implementar este esquema durante 30 días para validar
            rotación, incrementar ticket promedio y establecer una base sólida de
            ingresos recurrentes.
          </Text>
        </View>

        {/* CIERRE */}
        <View style={styles.closeBar}>
          <Text style={styles.closeBarText}>
            Este modelo no busca vender más… busca ganar mejor.
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado desde Liqui Moly Sales Hub.
          </Text>
          <Text style={styles.footerText}>
            Propuesta sujeta a ajustes según volumen, condiciones comerciales y estrategia de cierre.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/* ================= EXPORTS ================= */

export async function descargarComboPDF(data: ComboPdfData, fileName?: string) {
  const blob = await pdf(<ComboPDFDocument data={data} />).toBlob();
  const finalFileName = buildPdfFileName(fileName);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);

  return blob;
}

export async function compartirComboPdf(
  data: ComboPdfData,
  whatsappMessage?: string,
  fileName?: string
): Promise<{ sharedDirectly: boolean }> {
  const blob = await pdf(<ComboPDFDocument data={data} />).toBlob();
  const finalFileName = buildPdfFileName(fileName);
  const pdfFile = new File([blob], finalFileName, {
    type: "application/pdf",
  });

  const message =
    whatsappMessage?.trim() ||
    `Hola, te comparto la propuesta mensual de paquetes para ${
      data.agenciaNombre || "la agencia"
    }.`;

  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: {
      files?: File[];
      text?: string;
      title?: string;
    }) => Promise<void>;
  };

  try {
    if (nav.share && nav.canShare?.({ files: [pdfFile] })) {
      await nav.share({
        title: "Propuesta mensual Liqui Moly",
        text: message,
        files: [pdfFile],
      });

      return { sharedDirectly: true };
    }
  } catch (error) {
    console.error("No se pudo compartir directo con Web Share API:", error);
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = finalFileName;
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);

  const waUrl = `https://wa.me/?text=${sanitizeWhatsappText(message)}`;
  window.open(waUrl, "_blank");

  return { sharedDirectly: false };
}