'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerCotizacionPorId, Cotizacion } from '@/lib/firestore/cotizaciones';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MessageCircle } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsapp } from '@/lib/sharePdfWhatsApp';
import { CotizacionPDFData } from '@/lib/pdf/types';

function formatearFecha(fecha: Cotizacion['fecha_creacion'] | Cotizacion['fecha']) {
  try {
    if (
      fecha &&
      typeof fecha === 'object' &&
      'toDate' in fecha &&
      typeof fecha.toDate === 'function'
    ) {
      return fecha.toDate().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {}

  return new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const formatCotizacionForPDF = (cot: Cotizacion): CotizacionPDFData => {
  return {
    cliente: cot.clienteNombre || 'Cliente',
    fecha: formatearFecha(cot.fecha_creacion || cot.fecha),
    asesor: 'Ademar',
    subtotal: Number(cot.subtotal || 0),
    descuentos: Number(cot.totalDescuentos || 0),
    total: Number(cot.total || 0),
    observaciones: cot.observaciones || '',
    vigenciaDias: Number(cot.vigenciaDias || 7),
    items: (cot.items || []).map((item) => ({
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      subtotal: Number(item.precio || 0) * Number(item.cantidad || 0),
      total: Number(item.totalLinea || 0),
      descuentos: Array.isArray(item.descuentos) ? item.descuentos : [],
    })),
  };
};

export default function CotizacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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
      } catch (error) {
        console.error('Error al cargar cotización:', error);
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
    try {
      setIsExporting(true);
      const cotizacionDataForPdf = formatCotizacionForPDF(cotizacion);
      const doc = await generarCotizacionPDF(cotizacionDataForPdf);
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsSharing(true);
      const cotizacionDataForPdf = formatCotizacionForPDF(cotizacion);
      const doc = await generarCotizacionPDF(cotizacionDataForPdf);
      const pdfBlob = doc.output('blob');

      await sharePdfViaWhatsapp({
        fileName: `Cotizacion-${cotizacion.id || 'sin-id'}.pdf`,
        pdfBlob,
        message: `Hola, te comparto la cotización de ${cotizacion.clienteNombre || 'cliente'}.`,
      });
    } catch (error) {
      console.error('Error al compartir por WhatsApp:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="flex gap-2">
          <Button onClick={handleExportPDF} disabled={isExporting}>
            <Printer className="mr-2 h-4 w-4" />
            {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
          </Button>

          <Button onClick={handleShareWhatsApp} variant="outline" disabled={isSharing}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {isSharing ? 'Compartiendo...' : 'Compartir por WhatsApp'}
          </Button>
        </div>
      </div>

      <pre className="overflow-auto rounded border bg-white p-4">
        {JSON.stringify(cotizacion, null, 2)}
      </pre>
    </div>
  );
}
