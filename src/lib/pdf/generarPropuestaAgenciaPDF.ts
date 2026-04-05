import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  title: { fontSize: 18, marginBottom: 10 },
  section: { marginBottom: 10 },
  bold: { fontWeight: 'bold' },
});

export const generarPropuestaPDF = (data: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <Text style={styles.title}>Propuesta Comercial</Text>

      <View style={styles.section}>
        <Text>Agencia: {data.agencia}</Text>
        <Text>Fecha: {data.fecha}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.bold}>Detalle del combo</Text>

        {data.items.map((item: any, i: number) => (
          <Text key={i}>
            {item.nombre} - {item.cantidad} x ${item.precio}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.bold}>Resumen</Text>
        <Text>Inversión: ${data.totalCosto}</Text>
        <Text>Venta estimada: ${data.totalVenta}</Text>
        <Text>Utilidad agencia: ${data.utilidad}</Text>
        <Text>Comisión asesor: ${data.comision}</Text>
      </View>

      <View style={styles.section}>
        <Text>
          Este modelo permite a la agencia generar ingresos constantes con productos de alta calidad.
        </Text>
      </View>

    </Page>
  </Document>
);