'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerCotizacionPorId, type CotizacionFS } from '@/lib/firestore/cotizaciones';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, MessageCircle, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsapp } from '@/lib/sharePdfWhatsApp';
import { type CotizacionPDFData } from '@/lib/pdf/types';

type CotizacionItemExtendido = {
  codigo?: string;
  nombre?: string;
  cantidad?: number;
  precio?: number;
  descuentos?: Array<number | undefined>;
  subtotalLinea?: number;
  totalLinea?: number;
};

function formatearFecha(fecha: any) {
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

    const date = new Date(fecha);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('es-MX', {
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

const formatCotizacionForPDF = (cot: CotizacionFS): CotizacionPDFData => {
  return {
    cliente: cot.clienteNombre || 'Cliente',
    fecha: formatearFecha(cot.createdAt),
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
      subtotal: Number(item.subtotalLinea ?? (Number(item.precio || 0) * Number(item.cantidad || 0))),
      total: Number(item.totalLinea ?? (Number(item.precio || 0) * Number(item.cantidad || 0))),
      descuentos: Array.isArray(item.descuentos) ? item.descuentos : [],
    })),
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0));
}

export default function CotizacionDetallePage() {
  const params = useParams();
  const router = useRouter();

  const [cotizacion, setCotizacion] = useState<CotizacionFS | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [estado, setEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  useEffect(() => {
    if (typeof params.id !== 'string') return;

    const safeId = params.id;

    async function loadCotizacion() {
      try {
        setLoading(true);
        const cot = await obtenerCotizacionPorId(safeId);
        if (cot) {
          setCotizacion(cot);
          setEstado((cot as any).estado ?? 'pendiente');
        } else {
          setCotizacion(null);
        }
      } catch (error) {
        console.error('Error al cargar cotización:', error);
        setCotizacion(null);
      } finally {
        setLoading(false);
      }
    }

    loadCotizacion();
  }, [params.id]);

  const handleGuardarEstado = async (nuevoEstado: string) => {
    if (!cotizacion?.id) return;
    try {
      setGuardandoEstado(true);
      setEstado(nuevoEstado);
      await updateDoc(doc(db, 'cotizaciones', cotizacion.id), {
        estado: nuevoEstado,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado.');
    } finally {
      setGuardandoEstado(false);
    }
  };

  const ESTADOS = [
    { key: 'pendiente', label: 'Pendiente', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
    { key: 'enviada', label: 'Enviada', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Send },
    { key: 'aceptada', label: 'Aceptada', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    { key: 'rechazada', label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  ];

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
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de cotización</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cliente: {cotizacion.clienteNombre || 'Sin cliente'}
          </p>
          <p className="text-sm text-slate-500">
            Fecha: {formatearFecha(cotizacion.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Subtotal</p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(cotizacion.subtotal || 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Descuentos</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            -{formatCurrency(cotizacion.totalDescuentos || 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(cotizacion.total || 0)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Estado de la cotización</h2>
          {guardandoEstado && <span className="text-xs text-slate-400">Guardando...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => {
            const Icon = e.icon;
            const activo = estado === e.key;
            return (
              <button
                key={e.key}
                onClick={() => handleGuardarEstado(e.key)}
                disabled={guardandoEstado}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${activo ? e.color + ' ring-2 ring-offset-1' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon className="h-4 w-4" />
                {e.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-semibold">Productos</h2>

        {!cotizacion.items || cotizacion.items.length === 0 ? (
          <p className="mt-4 text-slate-500">No hay productos en esta cotización.</p>
        ) : (
          <>
            <div className="mt-4 space-y-4 md:hidden">
              {cotizacion.items.map((item, index) => {
                const itemData = item as CotizacionItemExtendido;
                return (
                  <div key={`${itemData.codigo || itemData.nombre || 'item'}-${index}`} className="rounded-2xl border bg-slate-50 p-4">
                    <p className="font-semibold">{itemData.nombre || 'Sin nombre'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {itemData.codigo || 'Sin código'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Cantidad</p>
                        <p className="mt-1 font-medium">{Number(itemData.cantidad || 0)}</p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Precio</p>
                        <p className="mt-1 font-medium">{formatCurrency(itemData.precio || 0)}</p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Subtotal</p>
                        <p className="mt-1 font-medium">
                          {formatCurrency(itemData.subtotalLinea || 0)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Total</p>
                        <p className="mt-1 font-medium">
                          {formatCurrency(itemData.totalLinea || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-2xl border md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-4 text-left text-sm font-semibold">Producto</th>
                    <th className="p-4 text-left text-sm font-semibold">Código</th>
                    <th className="p-4 text-left text-sm font-semibold">Cantidad</th>
                    <th className="p-4 text-left text-sm font-semibold">Precio</th>
                    <th className="p-4 text-left text-sm font-semibold">Subtotal</th>
                    <th className="p-4 text-left text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.items.map((item, index) => {
                    const itemData = item as CotizacionItemExtendido;

                    return (
                      <tr
                        key={`${itemData.codigo || itemData.nombre || 'item'}-${index}`}
                        className="border-t hover:bg-slate-50/70"
                      >
                        <td className="p-4 font-medium">{itemData.nombre || 'Sin nombre'}</td>
                        <td className="p-4">{itemData.codigo || 'Sin código'}</td>
                        <td className="p-4">{Number(itemData.cantidad || 0)}</td>
                        <td className="p-4">{formatCurrency(itemData.precio || 0)}</td>
                        <td className="p-4">{formatCurrency(itemData.subtotalLinea || 0)}</td>
                        <td className="p-4 font-semibold">
                          {formatCurrency(itemData.totalLinea || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-lg font-semibold">Observaciones</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {cotizacion.observaciones || 'Sin observaciones.'}
        </p>

        <div className="mt-4 text-sm text-slate-500">
          Vigencia: {cotizacion.vigenciaDias || 7} días
        </div>
      </section>
    </div>
  );
}
