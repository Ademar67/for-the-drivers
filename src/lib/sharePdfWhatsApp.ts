
import { generarCotizacionPDF } from './pdf/generarCotizacionPDF';
import { CotizacionPDFData } from './pdf/types';

// Extend the Navigator interface to include the Web Share API properties
// This avoids using @ts-ignore and provides type safety.
interface NavigatorWithShare extends Navigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { title: string; text: string; files: File[] }) => Promise<void>;
}

/**
 * Generates a PDF from quotation data and shares it via the Web Share API if available,
 * otherwise falls back to a WhatsApp URL.
 *
 * @param cotizacion - The quotation data compliant with CotizacionPDFData.
 */
export async function sharePdfViaWhatsApp(cotizacion: CotizacionPDFData): Promise<void> {
  try {
    const pdfBlob = await generarCotizacionPDF(cotizacion);
    const fileName = `cotizacion-${cotizacion.id}.pdf`;
    const message = `Te comparto la cotización ${cotizacion.id} por $${cotizacion.total.toFixed(2)}. Quedo atento.`;
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const navigator = window.navigator as NavigatorWithShare;

    // Check if Web Share API with file sharing is supported
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({
        title: 'Cotización',
        text: message,
        files: [file],
      });
    } else {
      // Fallback for browsers that do not support Web Share API for files
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error al compartir la cotización por WhatsApp:', error);
    // Optionally, you can add user-facing error handling here (e.g., a toast notification)
    alert('No se pudo compartir la cotización. Por favor, intente de nuevo.');
  }
}
