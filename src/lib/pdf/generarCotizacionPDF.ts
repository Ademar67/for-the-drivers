import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cotizacion } from '@/lib/firestore/cotizaciones';

console.log('🔥 USANDO PDF LIQUI MOLY NUEVO');

export function generarCotizacionPDF(cotizacion: Cotizacion) {
  console.log('🔥 generarCotizacionPDF ejecutada', cotizacion);
  
  const doc = new jsPDF();

  const AZUL = '#0033A0';
  const ROJO = '#E30613';

  const marginX = 14;
  let y = 30;

  // ─────────────────────────
  // HEADER LIQUI MOLY
  // ─────────────────────────
  doc.setFillColor(AZUL);
  doc.rect(0, 0, 210, 18, 'F');

  doc.setFillColor(ROJO);
  doc.rect(0, 18, 210, 4, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(12);
  doc.text('LIQUI MOLY', marginX, 12);
  doc.setFontSize(8);
  doc.text('FOR THE DRIVERS', marginX, 16);

  doc.setTextColor('#000000');

  // ─────────────────────────
  // DATOS ASESOR
  // ─────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('José Ademar Vázquez', marginX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.text('ASESOR DE VENTAS', marginX, y);
  y += 5;

  doc.text('Tel: (52-55) 5598 1718 | 5598 1719', marginX, y);
  y += 5;

  doc.text('Cel: 44 3618 8484', marginX, y);
  y += 5;

  doc.text('Email: ademar.vazquez@liqui-moly.mx', marginX, y);
  y += 10;

  // ─────────────────────────
  // FECHAS
  // ─────────────────────────
  const fechaEmision = cotizacion.fecha.toDate();
  const vigenciaDias = 7;
  const fechaVigencia = new Date(fechaEmision);
  fechaVigencia.setDate(fechaVigencia.getDate() + vigenciaDias);

  doc.setFont('helvetica', 'bold');
  doc.text('Cotización', 150, 30);

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha emisión: ${fechaEmision.toLocaleDateString()}`, 150, 36);
  doc.text(`Vigencia hasta: ${fechaVigencia.toLocaleDateString()}`, 150, 42);

  // ─────────────────────────
  // CLIENTE
  // ─────────────────────────
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${cotizacion.clienteNombre}`, marginX, y);
  y += 6;

  // Suponiendo que el domicilio pueda no estar en el objeto cotizacion.
  // Reemplazar con el campo correcto si existe, por ejemplo cotizacion.cliente.direccion
  // const direccionCliente = cotizacion.clienteDireccion || ''; 
  // doc.text(`Dirección: ${direccionCliente}`, marginX, y);
  // y += 8;


  // ─────────────────────────
  // TABLA PRODUCTOS
  // ─────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['Código', 'Producto', 'Cantidad', 'Precio Unit.', 'Total']],
    body: cotizacion.items.map(item => [
      item.codigo,
      item.nombre,
      item.cantidad.toString(),
      `$${item.precio.toFixed(2)}`,
      `$${(item.precio * item.cantidad).toFixed(2)}`
    ]),
    headStyles: {
      fillColor: AZUL,
      textColor: '#FFFFFF',
    },
    styles: {
      fontSize: 9,
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  const totalDescuentos = cotizacion.descuentos.reduce((acc, d) => {
    if (d !== undefined && d > 0) {
        // Este cálculo es una simplificación. La lógica real podría ser más compleja.
        // Aquí solo sumamos los porcentajes, lo cual no es correcto para el cálculo final del descuento.
        // La lógica de cálculo de descuentos debería estar en el componente que llama a esta función.
        // Por ahora, asumiremos que un valor `totalDescuentos` viene en el objeto `cotizacion` o se calcula antes.
    }
    return acc;
  }, 0);
  
  // Por ahora, como no tenemos el total de descuentos calculado, lo ponemos a 0.
  // Lo ideal es que cotizacion.totalDescuentos exista.
  const totalDescuentosCalculado = cotizacion.subtotal - cotizacion.total;


  // ─────────────────────────
  // TOTALES
  // ─────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${cotizacion.subtotal.toFixed(2)}`, 140, y);
  y += 5;

  doc.text(`Total descuentos: -$${totalDescuentosCalculado.toFixed(2)}`, 140, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ROJO);
  doc.text(`TOTAL: $${cotizacion.total.toFixed(2)}`, 140, y);
  doc.setTextColor('#000000');

  y += 12;

  // ─────────────────────────
  // OBSERVACIONES
  // ─────────────────────────
  doc.setDrawColor(AZUL);
  doc.rect(marginX, y, 182, 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Observaciones:', marginX + 2, y + 6);

  doc.setFont('helvetica', 'normal');
  const obs =
    // cotizacion.observaciones?.trim() ||
    '• Se acepta pago con terminal bancaria.\n• Precios sujetos a disponibilidad.\n• Tiempo de entrega estimado: 24 a 48 hrs.';

  doc.text(obs, marginX + 2, y + 12);

  // ─────────────────────────
  // GUARDAR
  // ─────────────────────────
  doc.save(`cotizacion-${cotizacion.clienteNombre}.pdf`);
}
