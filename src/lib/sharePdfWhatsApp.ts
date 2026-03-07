'use client';

interface NavigatorWithShare extends Navigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { title: string; text: string; files: File[] }) => Promise<void>;
}

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

  if (navigatorWithShare.share && navigatorWithShare.canShare?.({ files: [pdfFile] })) {
    try {
      await navigatorWithShare.share({
        files: [pdfFile],
        title: 'Cotización',
        text: message,
      });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Share action was cancelled by the user.');
        return;
      }
      console.error('Error using Web Share API, proceeding to fallback.', error);
    }
  }

  try {
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    const whatsappMessage = `${message}\n\n(El PDF se ha descargado en tu dispositivo. Por favor, adjúntalo a esta conversación.)`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);
  } catch (downloadError) {
    console.error('Error during fallback download:', downloadError);
    alert('No se pudo compartir ni descargar el PDF. Por favor, utiliza la opción "Exportar PDF" y compártelo manualmente.');
  }
}