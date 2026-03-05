import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { CotizacionPDFData } from './types';

const CORPORATE_BLUE = '#0033A0';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 32,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 100, // Increased bottom padding for fixed footer
    backgroundColor: '#ffffff',
    color: '#1f2937', 
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: 'contain',
  },
  headerLine: {
    width: '100%',
    height: 2,
    backgroundColor: CORPORATE_BLUE,
    marginTop: 10,
  },
  metaInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -28,
    marginBottom: 8,
    width: '100%',
  },
  metaInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORPORATE_BLUE,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 1,
  },

  // Client Info
  clientSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clientLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  clientSubValue: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 2,
  },

  // Table
  table: {
    marginTop: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: { 
    flexDirection: 'row',
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
  },
  colProducto: { width: '45%' },
  colCodigo: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  colCantidad: { width: '15%', textAlign: 'center' },
  colPrecio: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  // Totals
  totalsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 250,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalsLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  totalsValue: {
    fontSize: 10,
    color: '#1f2937',
    textAlign: 'right',
  },
  totalsDivider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 8,
  },
  finalTotalContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#eef2ff', // Light blue background
    borderRadius: 5,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORPORATE_BLUE,
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORPORATE_BLUE,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'left',
    fontSize: 9,
    color: '#4b5563',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerContact: {
    fontWeight: 'bold',
  },
  footerContactInfo: {
     marginTop: 2,
  },
  footerObservations: {
      borderLeftStyle: 'solid',
      borderLeftWidth: 2,
      borderLeftColor: '#d1d5db',
      paddingLeft: 10,
  },
  footerObservationsTitle: {
      fontWeight: 'bold',
      marginBottom: 3,
  }
});


function formatMoney(n: number) {
  return `$${n.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

export function CotizacionPDF({ data }: { data: CotizacionPDFData }) {
  const fecha = data.fecha_creacion
    ? new Date(data.fecha_creacion.seconds * 1000).toLocaleDateString('es-MX')
    : 'N/A';
  
  const vigenciaDias = data.vigenciaDias ?? 7;
  const fechaVigencia = new Date();
  fechaVigencia.setDate(fechaVigencia.getDate() + vigenciaDias);
  const vigencia = `Válido hasta ${fechaVigencia.toLocaleDateString('es-MX')}`;

  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/logo-liqui-moly.png" />
          <View style={styles.headerLine} />
        </View>

        <View style={styles.metaInfoContainer}>
          <View style={styles.metaInfo}>
            <Text style={styles.title}>Cotización</Text>
            <Text style={styles.metaText}>Folio: {data.id}</Text>
            <Text style={styles.metaText}>Fecha de emisión: {fecha}</Text>
            <Text style={styles.metaText}>Vigencia: {vigencia}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.clientSection}>
          <Text style={styles.clientLabel}>Cliente</Text>
          <Text style={styles.clientValue}>{data.clienteNombre}</Text>
          {data.clienteDireccion && <Text style={styles.clientSubValue}>{data.clienteDireccion}</Text>}
          {data.clienteTelefono && <Text style={styles.clientSubValue}>Tel: {data.clienteTelefono}</Text>}
        </View>
        
        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProducto]}>Producto</Text>
            <Text style={[styles.tableHeaderCell, styles.colCantidad]}>Cantidad</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrecio]}>Precio Unitario</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <View style={[styles.tableCell, styles.colProducto]}>
                <Text>{item.nombre}</Text>
                {item.codigo && <Text style={styles.colCodigo}>Código: {item.codigo}</Text>}
              </View>
              <Text style={[styles.tableCell, styles.colCantidad]}>{item.cantidad}</Text>
              <Text style={[styles.tableCell, styles.colPrecio]}>{formatMoney(item.precio)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatMoney(item.cantidad * item.precio)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Subtotal</Text>
                    <Text style={styles.totalsValue}>{formatMoney(data.subtotal)}</Text>
                </View>

                {data.totalDescuentos > 0 && (
                <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Total Descuentos</Text>
                    <Text style={styles.totalsValue}>- {formatMoney(data.totalDescuentos)}</Text>
                </View>
                )}

                <View style={styles.totalsDivider} />

                <View style={styles.finalTotalContainer}>
                    <View style={styles.finalTotalRow}>
                        <Text style={styles.finalTotalLabel}>TOTAL</Text>
                        <Text style={styles.finalTotalValue}>{formatMoney(data.total)}</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
            <View style={styles.footerContent}>
                 <View>
                    <Text style={styles.footerContact}>José Ademar Vázquez</Text>
                    <Text style={styles.footerContactInfo}>Asesor de Ventas</Text>
                    <Text style={styles.footerContactInfo}>Cel: 44 3618 8484</Text>
                    <Text style={styles.footerContactInfo}>Email: ademar.vazquez@liqui-moly.mx</Text>
                </View>
                <View style={styles.footerObservations}>
                    <Text style={styles.footerObservationsTitle}>Observaciones:</Text>
                    <Text>• Se acepta pago con terminal bancaria.</Text>
                    <Text>• Precios sujetos a disponibilidad.</Text>
                </View>
            </View>
        </View>
      </Page>
    </Document>
  );
}