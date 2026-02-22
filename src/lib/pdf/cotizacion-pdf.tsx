
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { Cotizacion } from '@/lib/firestore/cotizaciones';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 30,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0033A0',
    paddingBottom: 10,
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: 'contain',
  },
  headerText: {
    textAlign: 'right',
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: '25%',
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#0033A0',
    color: '#ffffff',
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
  }
});

interface CotizacionPDFProps {
  cotizacion: Cotizacion;
}

export function CotizacionPDF({ cotizacion }: CotizacionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src="/logo-liqui-moly.png" />
          <View style={styles.headerText}>
            <Text>Cotización</Text>
            <Text>Fecha: {new Date(cotizacion.fecha_creacion.seconds * 1000).toLocaleDateString()}</Text>
            <Text>Folio: {cotizacion.id}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Cliente: {cotizacion.clienteNombre}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Producto</Text>
            <Text style={styles.tableColHeader}>Cantidad</Text>
            <Text style={styles.tableColHeader}>Precio Unitario</Text>
            <Text style={styles.tableColHeader}>Total</Text>
          </View>
          {cotizacion.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol}>{item.nombre}</Text>
              <Text style={styles.tableCol}>{item.cantidad}</Text>
              <Text style={styles.tableCol}>${item.precio.toFixed(2)}</Text>
              <Text style={styles.tableCol}>${(item.cantidad * item.precio).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={{ ...styles.section, textAlign: 'right' }}>
          <Text>Subtotal: ${cotizacion.subtotal.toFixed(2)}</Text>
          <Text>Total: ${cotizacion.total.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Gracias por su preferencia.</Text>
        </View>
      </Page>
    </Document>
  );
}
