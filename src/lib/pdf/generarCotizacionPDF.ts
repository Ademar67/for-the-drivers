import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cotizacion } from '@/lib/firestore/cotizaciones';

console.log('🔥 USANDO PDF LIQUI MOLY NUEVO');

type CotizacionPDFData = {
    clienteNombre: string;
    clienteDireccion?: string;
    items: { codigo: string; nombre: string; cantidad: number; precio: number }[];
    subtotal: number;
    total: number;
    totalDescuentos: number;
    observaciones: string;
    vigenciaDias: number;
}

export function generarCotizacionPDF(data: CotizacionPDFData) {
  console.log('🔥 generarCotizacionPDF ejecutada', data);
  
  const { 
      clienteNombre, 
      clienteDireccion, 
      items, 
      subtotal, 
      total, 
      totalDescuentos, 
      observaciones, 
      vigenciaDias 
  } = data;
  
  const doc = new jsPDF();

  // Colores Liqui Moly
  const AZUL = '#0033A0';
  const ROJO = '#E30613';

  const marginX = 14;
  let cursorY = 20;

  // ─────────────────────────────
  // ENCABEZADO LIQUI MOLY
  // ─────────────────────────────
  doc.setFillColor(AZUL);
  doc.rect(0, 0, 210, 18, 'F');

  doc.setFillColor(ROJO);
  doc.rect(0, 18, 210, 4, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(12);
  doc.text('LIQUI MOLY', marginX, 12);
  doc.setFontSize(8);
  doc.text('FOR THE DRIVERS', marginX, 16);

  cursorY = 30;
  doc.setTextColor('#000000');

  // ─────────────────────────────
  // DATOS ASESOR
  // ─────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('José Ademar Vázquez', marginX, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.text('ASESOR DE VENTAS', marginX, cursorY);
  cursorY += 5;

  doc.text('Tel: (52-55) 5598 1718 | 5598 1719', marginX, cursorY);
  cursorY += 5;

  doc.text('Cel: 44 3618 8484', marginX, cursorY);
  cursorY += 5;

  doc.text('Email: ademar.vazquez@liqui-moly.mx', marginX, cursorY);
  cursorY += 8;

  // ─────────────────────────────
  // DATOS CLIENTE + FECHAS
  // ─────────────────────────────
  const fechaEmision = new Date();
  const fechaVigencia = new Date(fechaEmision);
  fechaVigencia.setDate(fechaVigencia.getDate() + (vigenciaDias || 7));

  doc.setFont('helvetica', 'bold');
  doc.text('Cotización', 150, 30);

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha emisión: ${fechaEmision.toLocaleDateString()}`, 150, 36);
  doc.text(`Vigencia hasta: ${fechaVigencia.toLocaleDateString()}`, 150, 42);

  cursorY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${clienteNombre || ''}`, marginX, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.text(`Dirección: ${clienteDireccion || ''}`, marginX, cursorY);
  cursorY += 10;

  // ─────────────────────────────
  // TABLA PRODUCTOS
  // ─────────────────────────────
  autoTable(doc, {
    startY: cursorY,
    head: [['Código', 'Producto', 'Cantidad', 'Precio Unit.', 'Total']],
    body: items.map((p) => [
      p.codigo,
      p.nombre,
      p.cantidad.toString(),
      `$${p.precio.toFixed(2)}`,
      `$${(p.cantidad * p.precio).toFixed(2)}`
    ]),
    headStyles: {
      fillColor: AZUL,
      textColor: '#FFFFFF',
    },
    styles: {
      fontSize: 9,
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 8;

  // ─────────────────────────────
  // TOTALES
  // ─────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, cursorY);
  cursorY += 5;

  doc.text(`Total descuentos: -$${totalDescuentos.toFixed(2)}`, 140, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ROJO);
  doc.text(`TOTAL: $${total.toFixed(2)}`, 140, cursorY);
  doc.setTextColor('#000000');

  cursorY += 12;

  // ─────────────────────────────
  // OBSERVACIONES
  // ─────────────────────────────
  doc.setDrawColor(AZUL);
  doc.rect(marginX, cursorY, 182, 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Observaciones:', marginX + 2, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  const obsTexto =
    observaciones?.trim() ||
    '• Se acepta pago con terminal bancaria.\n• Precios sujetos a disponibilidad.\n• Tiempo de entrega estimado: 24 a 48 hrs.';

  doc.text(obsTexto, marginX + 2, cursorY + 12);

  // ─────────────────────────────
  // GUARDAR
  // ─────────────────────────────
  doc.save(`cotizacion-${clienteNombre || 'cliente'}.pdf`);
}
