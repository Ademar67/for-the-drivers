'use client';

type SharePdfParams = {
  fileName: string;
  pdfBlob: Blob;
  message: string;
};

async function sharePdfBase({
  fileName,
  pdfBlob,
  message,
}: SharePdfParams) {
  const file = new File([pdfBlob], fileName, {
    type: 'application/pdf',
  });

  const nav = navigator as any;

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'Cotización',
        text: message,
      });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Share error', error);
    }
  }

  const url = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
  }, 500);
}

export async function sharePdfViaWhatsapp(params: SharePdfParams) {
  return sharePdfBase(params);
}

export async function sharePdfWhatsApp(params: SharePdfParams) {
  return sharePdfBase(params);
}