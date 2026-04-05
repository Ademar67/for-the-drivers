import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

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
  agenciaNombre?: string;
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
  generatedAt?: Date;
  items: ComboPdfItem[];
};

const CORPORATE_BLUE = "#0033A0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 34,
    paddingHorizontal: 34,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dbe4ff",
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    color: CORPORATE_BLUE,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 10,
    color: "#475569",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: CORPORATE_BLUE,
    marginBottom: 6,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  cardLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  cardValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colNombre: {
    width: "30%",
    paddingRight: 6,
  },
  colCant: {
    width: "8%",
    textAlign: "right",
  },
  colNum: {
    width: "15.5%",
    textAlign: "right",
  },
  th: {
    fontSize: 8,
    fontWeight: 700,
    color: "#1e3a8a",
  },
  td: {
    fontSize: 8.5,
    color: "#0f172a",
  },
  readingBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 8,
    backgroundColor: "#f8fbff",
    padding: 10,
  },
  readingTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: 4,
  },
  readingText: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#334155",
  },
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 8,
    color: "#64748b",
  },
});

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date?: Date) {
  const safeDate = date ?? new Date();
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(safeDate);
}

function ComboPdfDocument({ data }: { data: ComboPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Liqui Moly Sales Hub</Text>
          <Text style={styles.subtitle}>Propuesta comercial de combo para agencia</Text>
          <Text style={styles.subtitle}>
            Agencia: {data.agenciaNombre || "General"} · Fecha: {formatDate(data.generatedAt)}
          </Text>
          <Text style={styles.subtitle}>Combo: {data.comboNombre}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen comercial</Text>
          <View style={styles.cardGrid}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Precio total combo</Text>
              <Text style={styles.cardValue}>{money(data.precioTotal)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Utilidad neta combo</Text>
              <Text style={styles.cardValue}>{money(data.utilidadNetaCombo)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Comisión asesor</Text>
              <Text style={styles.cardValue}>{money(data.comisionTotalCombo)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Ventas estimadas al mes</Text>
              <Text style={styles.cardValue}>{String(data.ventasMes)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Utilidad mensual agencia</Text>
              <Text style={styles.cardValue}>{money(data.utilidadMensualAgencia)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Comisión mensual asesor</Text>
              <Text style={styles.cardValue}>{money(data.comisionMensualAsesor)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del combo</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNombre]}>Paquete</Text>
              <Text style={[styles.th, styles.colCant]}>Cant.</Text>
              <Text style={[styles.th, styles.colNum]}>Costo</Text>
              <Text style={[styles.th, styles.colNum]}>Precio</Text>
              <Text style={[styles.th, styles.colNum]}>Comisión</Text>
              <Text style={[styles.th, styles.colNum]}>Utilidad neta</Text>
            </View>

            {data.items.map((item, index) => (
              <View
                key={`${item.nombre}-${index}`}
                style={[
                  styles.row,
                  index === data.items.length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={[styles.td, styles.colNombre]}>{item.nombre}</Text>
                <Text style={[styles.td, styles.colCant]}>{item.cantidad}</Text>
                <Text style={[styles.td, styles.colNum]}>{money(item.subtotalCosto)}</Text>
                <Text style={[styles.td, styles.colNum]}>{money(item.subtotalPrecio)}</Text>
                <Text style={[styles.td, styles.colNum]}>{money(item.subtotalComision)}</Text>
                <Text style={[styles.td, styles.colNum]}>{money(item.subtotalUtilidadNeta)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Lectura comercial</Text>
          <Text style={styles.readingText}>
            Si la agencia vende {data.ventasMes} combos al mes, con un ticket promedio de{" "}
            {money(data.ticketPromedio)}, puede generar una utilidad aproximada de{" "}
            {money(data.utilidadMensualAgencia)} al mes. A la vez, el esquema considera una
            comisión mensual estimada para el asesor de {money(data.comisionMensualAsesor)}.
            Esto convierte el combo en una propuesta clara para subir ticket promedio, vender
            con más estructura y defender la utilidad del negocio.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores</Text>
          <View style={styles.cardGrid}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Costo total</Text>
              <Text style={styles.cardValue}>{money(data.costoTotal)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Utilidad bruta</Text>
              <Text style={styles.cardValue}>{money(data.utilidadTotal)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Margen bruto</Text>
              <Text style={styles.cardValue}>{data.margenBrutoPct.toFixed(1)}%</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Piezas por combo</Text>
              <Text style={styles.cardValue}>{String(data.piezasTotalesCombo)}</Text>
            </View>
          </View>
        </View>

        {data.observaciones ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.readingText}>{data.observaciones}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Documento generado desde Liqui Moly Sales Hub. Esta propuesta puede ajustarse
          según volumen, condiciones comerciales y estrategia de cierre.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarComboPdfBlob(data: ComboPdfData) {
  return pdf(<ComboPdfDocument data={data} />).toBlob();
}

export async function descargarComboPDF(data: ComboPdfData, fileName?: string) {
  const blob = await generarComboPdfBlob(data);

  const safeName =
    fileName ||
    `combo-${(data.agenciaNombre || "agencia")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/gi, "")}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return blob;
}

export async function compartirComboPdf(
  data: ComboPdfData,
  text: string,
  fileName?: string
) {
  const blob = await generarComboPdfBlob(data);

  const safeName =
    fileName ||
    `combo-${(data.agenciaNombre || "agencia")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/gi, "")}.pdf`;

  const file = new File([blob], safeName, { type: "application/pdf" });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({
      title: "Combo comercial Liqui Moly",
      text,
      files: [file],
    });

    return { sharedDirectly: true };
  }

  await descargarComboPDF(data, safeName);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  return { sharedDirectly: false };
}