import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CotizacionPDFData } from './types';

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function safeText(value?: string, fallback = '-') {
  return (value || '').trim() || fallback;
}

function splitText(doc: jsPDF, text: string, width: number) {
  return doc.splitTextToSize(text || '', width);
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
    return null;
  }
}

export async function generarCotizacionPDF(data: CotizacionPDFData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const colors = {
    navy: [12, 36, 74] as [number, number, number],
    blue: [0, 102, 204] as [number, number, number],
    lightBlue: [235, 243, 252] as [number, number, number],
    gray: [90, 98, 110] as [number, number, number],
    dark: [35, 35, 35] as [number, number, number],
    lightGray: [245, 247, 250] as [number, number, number],
    border: [220, 225, 230] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  // HEADER
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, 34, 'F');

  const logoDataUrl = await loadImageAsDataUrl('/logo-liqui-moly.png');
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 6, 32, 16);
    } catch (error) {
      console.warn('No se pudo dibujar el logo:', error);
    }
  }

  doc.setTextColor(...colors.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('COTIZACIÓN COMERCIAL', pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Propuesta profesional de suministro', pageWidth - 14, 21, {
    align: 'right',
  });
  doc.text(`Fecha: ${safeText(data.fecha)}`, pageWidth - 14, 27, {
    align: 'right',
  });

  let currentY = 42;

  // DATOS
  doc.setFillColor(...colors.lightGray);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(12, currentY, pageWidth - 24, 24, 3, 3, 'FD');

  doc.setTextColor(...colors.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DATOS DE LA PROPUESTA', 16, currentY + 8);

  doc.setTextColor(...colors.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Cliente: ${safeText(data.cliente)}`, 16, currentY + 15);
  doc.text(`Asesor: ${safeText(data.asesor, 'Liqui Moly')}`, 90, currentY + 15);
  doc.text(`Vigencia: ${Number(data.vigenciaDias || 7)} días`, 155, currentY + 15);

  currentY += 30;

  // TABLA
  const body = (data.items || []).map((item, index) => {
    const subtotalLinea = Number(item.subtotal ?? 0);
    const totalLinea = Number(item.total || 0);
    const ahorroLinea = Math.max(subtotalLinea - totalLinea, 0);

    return [
      String(index + 1),
      safeText(item.codigo, '-'),
      safeText(item.nombre),
      String(Number(item.cantidad || 0)),
      money(Number(item.precio || 0)),
      money(ahorroLinea),
      money(totalLinea),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#',
      'Código',
      'Producto',
      'Cant.',
      'Precio Unit.',
      'Ahorro',
      'Importe',
    ]],
    body,
    theme: 'grid',
    margin: { left: 12, right: 12 },
    styles: {
      font: 'helvetica',
      fontSize: 8.8,
      cellPadding: 2.8,
      textColor: [40, 40, 40],
      lineColor: colors.border,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: colors.blue,
      textColor: colors.white,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fillColor: colors.white,
    },
    alternateRowStyles: {
      fillColor: colors.lightGray,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 76 },
      3: { halign: 'center', cellWidth: 13 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        hookData.cell.styles.textColor = colors.red;
      }

      if (hookData.section === 'body' && hookData.column.index === 6) {
        hookData.cell.styles.textColor = colors.green;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ||
    currentY + 50;

  let sectionY = finalY + 8;

  // OBSERVACIONES
  const observacionesHeight = 34;
  doc.setFillColor(...colors.lightBlue);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(12, sectionY, 118, observacionesHeight, 3, 3, 'FD');

  doc.setTextColor(...colors.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('OBSERVACIONES', 16, sectionY + 7);

  doc.setTextColor(...colors.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);

  const observacionesTexto = safeText(
    data.observaciones,
    'Propuesta elaborada conforme a los requerimientos compartidos por el cliente.'
  );
  const observacionesLines = splitText(doc, observacionesTexto, 108);
  doc.text(observacionesLines, 16, sectionY + 14);

  // RESUMEN
  doc.setFillColor(...colors.navy);
  doc.roundedRect(136, sectionY, pageWidth - 148, observacionesHeight, 3, 3, 'F');

  doc.setTextColor(...colors.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESUMEN', 140, sectionY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);

  doc.text('Subtotal:', 140, sectionY + 14);
  doc.text(money(data.subtotal), pageWidth - 16, sectionY + 14, { align: 'right' });

  doc.text('Descuentos:', 140, sectionY + 20);
  doc.text(money(data.descuentos), pageWidth - 16, sectionY + 20, { align: 'right' });

  doc.text('Vigencia:', 140, sectionY + 26);
  doc.text(`${Number(data.vigenciaDias || 7)} días`, pageWidth - 16, sectionY + 26, {
    align: 'right',
  });

  doc.setDrawColor(...colors.white);
  doc.line(140, sectionY + 28.5, pageWidth - 16, sectionY + 28.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TOTAL:', 140, sectionY + 34);
  doc.text(money(data.total), pageWidth - 16, sectionY + 34, { align: 'right' });

  sectionY += 42;

  // VALOR COMERCIAL
  const remainingSpace = pageHeight - sectionY - 24;
  const valueBoxHeight = Math.max(26, Math.min(remainingSpace, 34));

  doc.setFillColor(...colors.lightGray);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(12, sectionY, pageWidth - 24, valueBoxHeight, 3, 3, 'FD');

  doc.setTextColor(...colors.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('VALOR AGREGADO DE LA PROPUESTA', 16, sectionY + 7);

  doc.setTextColor(...colors.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);

  const valorLines = [
    '• Solución enfocada en operación confiable....',
    '• Productos premium con respaldo técnico especializado.',
    '• Mejora en rendimiento y eficiencia operativa.',
    '• Reducción de desgaste y mayor vida útil del motor.',
  ];

  valorLines.forEach((line, i) => {
    doc.text(line, 16, sectionY + 14 + i * 5);
  });

  // FOOTER
  doc.setDrawColor(...colors.border);
  doc.line(12, pageHeight - 16, pageWidth - 12, pageHeight - 16);

  doc.setTextColor(...colors.gray);
  doc.setFontSize(8);
  doc.text('Liqui Moly Sales Hub', 12, pageHeight - 10);
  doc.text('Propuesta comercial generada digitalmente', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });
  doc.text('Página 1', pageWidth - 12, pageHeight - 10, { align: 'right' });

  return doc;
}