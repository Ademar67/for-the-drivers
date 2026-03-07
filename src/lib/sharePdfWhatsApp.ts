'use client';

// The interface for navigator.share is not in the default TS libs for browsers yet.
// We extend the Navigator interface to include the Web Share API properties.
interface NavigatorWithShare extends Navigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { title: string; text: string; files: File[] }) => Promise<void>;
}

/**
 * Shares a PDF file via the Web Share API if supported.
 * If not, it downloads the PDF and then opens WhatsApp for manual attachment.
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

  // 1. Try to share directly with the file (ideal for mobile).
  if (navigatorWithShare.share && navigatorWithShare.canShare?.({ files: [pdfFile] })) {
    try {
      await navigatorWithShare.share({
        files: [pdfFile],
        title: 'Cotización',
        text: message,
      });
      return; // Success!
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // This is expected if the user cancels the share dialog.
        console.log('Share action was cancelled by the user.');
        return;
      }
      // If another error occurs, we'll proceed to the fallback.
      console.error('Error using Web Share API, proceeding to fallback.', error);
    }
  }

  // 2. Fallback for desktop or unsupported browsers.
  try {
    // Initiate the download of the PDF file.
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    // Prepare a message for WhatsApp, instructing the user to attach the downloaded file.
    const whatsappMessage = `${message}\n\n(El PDF se ha descargado en tu dispositivo. Por favor, adjúntalo a esta conversación.)`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Give a brief moment for the download to start before opening the WhatsApp tab.
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);

  } catch (downloadError) {
    console.error('Error during fallback download:', downloadError);
    // A final, ultimate fallback if something goes wrong with the download process itself.
    alert('No se pudo compartir ni descargar el PDF. Por favor, utiliza la opción "Exportar a PDF" y compártelo manually.');
  }
}
