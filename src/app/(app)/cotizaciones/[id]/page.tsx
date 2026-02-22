
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerCotizacionPorId, Cotizacion } from '@/lib/firestore/cotizaciones';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';

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
    const blob = await generarCotizacionPDF(cotizacion);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <Button onClick={handleExportPDF}>
          <Printer className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <pre className="bg-white p-4 rounded border">
        {JSON.stringify(cotizacion, null, 2)}
      </pre>
    </div>
  );
}
