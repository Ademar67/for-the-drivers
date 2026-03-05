
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerCotizacionPorId, Cotizacion } from '@/lib/firestore/cotizaciones';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MessageCircle } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsApp } from '@/lib/sharePdfWhatsApp';
import { CotizacionPDFData } from '@/lib/pdf/types';

// Helper to convert Firestore Timestamp to a plain object for PDF generation
const formatCotizacionForPDF = (cot: Cotizacion): CotizacionPDFData => {
    // Basic mapping, assuming structure compatibility between Cotizacion and CotizacionPDFData
    const pdfData: CotizacionPDFData = {
        id: cot.id,
        clienteNombre: cot.clienteNombre,
        items: cot.items,
        subtotal: cot.subtotal,
        totalDescuentos: cot.totalDescuentos,
        total: cot.total,
    };

    if (cot.fecha_creacion) {
        pdfData.fecha_creacion = {
            seconds: cot.fecha_creacion.seconds,
            nanoseconds: cot.fecha_creacion.nanoseconds,
        };
    }

    if (cot.clienteDireccion) pdfData.clienteDireccion = cot.clienteDireccion;
    if (cot.clienteTelefono) pdfData.clienteTelefono = cot.clienteTelefono;
    if (cot.observaciones) pdfData.observaciones = cot.observaciones;
    if (cot.vigenciaDias) pdfData.vigenciaDias = cot.vigenciaDias;

    return pdfData;
};


export default function CotizacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof params.id !== 'string') return;

    const safeId = params.id;

    async function loadCotizacion() {
      try {
        setLoading(true);
        const cot = await obtenerCotizacionPorId(safeId);
        if (cot) {
          setCotizacion(cot);
        }
      } finally {
        setLoading(false);
      }
    }

    loadCotizacion();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Cargando cotización...</div>;
  }

  if (!cotizacion) {
    return <div className="p-6">Cotización no encontrada.</div>;
  }

  const handleExportPDF = async () => {
    if (!cotizacion) return;
    const cotizacionDataForPdf = formatCotizacionForPDF(cotizacion);
    const blob = await generarCotizacionPDF(cotizacionDataForPdf);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };
  
  const handleShareWhatsApp = async () => {
    if (!cotizacion) return;
    const cotizacionDataForPdf = formatCotizacionForPDF(cotizacion);
    await sharePdfViaWhatsApp(cotizacionDataForPdf);
  };


  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className='flex gap-2'>
          <Button onClick={handleExportPDF}>
            <Printer className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button onClick={handleShareWhatsApp} variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" /> Compartir por WhatsApp
          </Button>
        </div>
      </div>

      <pre className="bg-white p-4 rounded border">
        {JSON.stringify(cotizacion, null, 2)}
      </pre>
    </div>
  );
}
