import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { CotizacionPDFData } from './types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 28,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 36,
    backgroundColor: '#ffffff',
    color: '#111827',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logo: {
    width: 140,
    height: 46,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0033A0',
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: '#374151',
    marginTop: 1,
  },

  divider: {
    height: 2,
    backgroundColor: '#0033A0',
    marginTop: 10,
    marginBottom: 14,
  },

  section: { marginBottom: 10 },

  label: { fontSize: 9, color: '#6B7280' },
  value: { fontSize: 10, color: '#111827', marginTop: 2 },

  // Table
  table: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  tableRow: { flexDirection: 'row' },
  tableHeader: {
    backgroundColor: '#0033A0',
    color: '#ffffff',
    fontWeight: 'bold',
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9,
  },
  cell: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 9,
  },

  colProducto: { width: '46%' },
  colCantidad: { width: '14%', textAlign: 'center' as const },
  colPrecio: { width: '20%', textAlign: 'right' as const },
  colTotal: { width: '20%', textAlign: 'right' as const },

  // Totals box
  totalsWrap: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 260,
    backgroundColor: '#F3F4F6', // gris suave
    borderRadius: 8,
    padding: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalsLabel: { fontSize: 9, color: '#374151' },
  totalsValue: { fontSize: 9, color: '#111827' },
  totalsDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  totalBigLabel: { fontSize: 11, fontWeight: 'bold', color: '#0033A0' },
  totalBigValue: { fontSize: 18, fontWeight: 'bold', color: '#0033A0' },

  // Conditions
  conditionsWrap: { marginTop: 14 },
  conditionsText: { fontSize: 9, color: '#374151', marginTop: 3 },

  // Footer signature
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
  },
  footerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  signatureName: { fontSize: 10, fontWeight: 'bold', color: '#111827' },
  signatureRole: { fontSize: 9, color: '#374151', marginTop: 2 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  icon: { width: 10, height: 10, marginRight: 6, objectFit: 'contain' },
  signatureText: { fontSize: 9, color: '#374151' },

  thanks: { fontSize: 8, color: '#6B7280', textAlign: 'center', marginTop: 10 },
});

interface CotizacionPDFProps {
  data: CotizacionPDFData & {
    // Vigencia manual (si no viene, ponemos 7 días por defecto)
    vigencia?: string; // ej "7 días" o "Hasta 10/03/2026"
  };
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

export function CotizacionPDF({ data }: CotizacionPDFProps) {
  const fecha = data.fecha_creacion
    ? new Date(data.fecha_creacion.seconds * 1000).toLocaleDateString()
    : null;

  const vigencia = data.vigencia ?? '7 días';

  // Protección: si items viene raro, no truena
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/logo-liqui-moly.png" />
          <View style={styles.headerRight}>
            <Text style={styles.title}>Cotización</Text>
            {fecha && <Text style={styles.meta}>Fecha: {fecha}</Text>}
            <Text style={styles.meta}>Folio: {data.id}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.label}>Datos del Cliente</Text>
          <Text style={styles.value}>{data.clienteNombre}</Text>
          {data.clienteDireccion ? (
            <Text style={[styles.value, { fontSize: 9, color: '#374151' }]}>
              {data.clienteDireccion}
            </Text>
          ) : null}
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.colProducto]}>Producto</Text>
            <Text style={[styles.colCantidad]}>Cantidad</Text>
            <Text style={[styles.colPrecio]}>Precio Unitario</Text>
            <Text style={[styles.colTotal]}>Total</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colProducto]}>
                {item.nombre}
                {item.codigo ? `\nCódigo: ${item.codigo}` : ''}
              </Text>
              <Text style={[styles.cell, styles.colCantidad]}>{item.cantidad}</Text>
              <Text style={[styles.cell, styles.colPrecio]}>{formatMoney(item.precio)}</Text>
              <Text style={[styles.cell, styles.colTotal]}>
                {formatMoney(item.cantidad * item.precio)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatMoney(data.subtotal)}</Text>
            </View>

            {data.totalDescuentos > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Descuentos</Text>
                <Text style={styles.totalsValue}>- {formatMoney(data.totalDescuentos)}</Text>
              </View>
            ) : null}

            <View style={styles.totalsDivider} />

            <View style={styles.totalsRow}>
              <Text style={styles.totalBigLabel}>TOTAL</Text>
              <Text style={styles.totalBigValue}>{formatMoney(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Condiciones */}
        <View style={styles.conditionsWrap}>
          <Text style={styles.label}>Condiciones</Text>
          <Text style={styles.conditionsText}>Vigencia: {vigencia}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.signatureName}>José Ademar Vázquez</Text>
          <Text style={styles.signatureRole}>Asesor de Ventas</Text>

          <View style={styles.signatureRow}>
            <Image style={styles.icon} src="/whatsapp.png" />
            <Text style={styles.signatureText}>WhatsApp: 443 618 8484</Text>
          </View>

          <View style={styles.signatureRow}>
            <Text style={styles.signatureText}>Email: ademar.vazquez@liqui-moly.mx</Text>
          </View>

          <Text style={styles.thanks}>Gracias por su preferencia.</Text>
        </View>
      </Page>
    </Document>
  );
}