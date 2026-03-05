import { generarCotizacionPDF } from './pdf/generarCotizacionPDF';
import { CotizacionPDFData } from './types';

// Extend the Navigator interface to include the Web Share API properties
// This avoids using @ts-ignore and provides type safety.
interface NavigatorWithShare extends Navigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { title: string; text: string; files: File[] }) => Promise<void>;
}

/**
 * Downloads a blob by creating a temporary link and clicking it.
 * @param blob The blob to download.
 * @param fileName The desired name for the downloaded file.
 */
function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}


/**
 * Generates a PDF from quotation data and shares it via the Web Share API if available.
 * If sharing fails or is not supported, it downloads the PDF and instructs the user
 * to share it manually.
 *
 * @param cotizacion - The quotation data compliant with CotizacionPDFData.
 */
export async function sharePdfViaWhatsApp(cotizacion: CotizacionPDFData): Promise<void> {
  try {
    const pdfBlob = await generarCotizacionPDF(cotizacion);
    const shortId = cotizacion.id === 'NUEVA' ? 'nueva' : cotizacion.id.substring(0, 7);
    const fileName = `cotizacion-${shortId}.pdf`;
    const totalFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cotizacion.total);
    const message = `¡Hola! Te comparto la cotización ${shortId} para ${cotizacion.clienteNombre} por un total de ${totalFormatted}. Quedo a tus órdenes.`;
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    const navigator = window.navigator as NavigatorWithShare;

    // We try to share directly if the API is available.
    // The `canShare` check is optional; some browsers support `share` but not `canShare`.
    // We will rely on the try/catch to handle cases where file sharing isn't supported.
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cotización ${shortId}`,
          text: message,
          files: [file],
        });
        // If the share is successful, we're done.
        return;
      } catch (error: any) {
        // If the user cancels the share dialog, it's not an error. We just stop.
        if (error.name === 'AbortError') {
          console.log('El usuario canceló la acción de compartir.');
          return;
        }
        // If another error occurs (e.g., file sharing not supported), we fall through to the download logic.
        console.warn('navigator.share falló, se procederá a descargar:', error);
      }
    }

    // --- Fallback ---
    // If navigator.share doesn't exist, or if it failed, we download the file.
    downloadFile(pdfBlob, fileName);
    alert('No se pudo compartir directamente. El PDF se ha descargado. Por favor, adjúntalo manualmente en WhatsApp.');

  } catch (error) {
    console.error('Error al generar o compartir la cotización:', error);
    alert('No se pudo generar ni compartir la cotización. Por favor, inténtalo de nuevo.');
  }
}
