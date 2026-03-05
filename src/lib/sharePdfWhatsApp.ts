'use client';

// The interface for navigator.share is not in the default TS libs for browsers yet.
// We extend the Navigator interface to include the Web Share API properties.
interface NavigatorWithShare extends Navigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { title: string; text: string; files: File[] }) => Promise<void>;
}

/**
 * Shares a PDF file via the Web Share API if supported, otherwise falls back to a WhatsApp link.
 * @param {object} params - The parameters for sharing.
 * @param {string} params.fileName - The name of the file to be shared.
 * @param {Blob} params.pdfBlob - The PDF content as a Blob.
 * @param {string} params.message - The text message to accompany the share.
 */
export async function sharePdfViaWhatsapp({
  fileName,
  pdfBlob,
  message,
}: {
  fileName: string;
  pdfBlob: Blob;
  message: string;
}) {
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
  const navigatorWithShare = navigator as NavigatorWithShare;

  // Check if Web Share API with file sharing is supported
  if (navigatorWithShare.share && navigatorWithShare.canShare?.({ files: [pdfFile] })) {
    try {
      await navigatorWithShare.share({
        files: [pdfFile],
        title: 'Cotización',
        text: message,
      });
      // Share was successful
      return;
    } catch (error) {
      // User might have cancelled the share. We don't need to do anything.
      // If it's a real error, it will be logged, but we proceed to fallback as a safe measure.
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Share action was cancelled by the user.');
        return;
      }
      console.error('Error using Web Share API:', error);
    }
  }

  // Fallback to opening a WhatsApp link with a pre-filled message
  const fallbackMessage = `${message}\n\n(No se pudo adjuntar el PDF automáticamente. Por favor, descárgalo desde la opción "Exportar a PDF" y adjúntalo manualmente.)`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    fallbackMessage
  )}`;
  window.open(whatsappUrl, '_blank');
}
