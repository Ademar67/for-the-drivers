'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerCotizacionPorId, Cotizacion } from '@/lib/firestore/cotizaciones';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';

export default function CotizacionDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;

    async function loadCotizacion() {
      try {
        setLoading(true);
        const cot = await obtenerCotizacionPorId(id);
        if (cot) {
          setCotizacion(cot);
        } else {
          // Opcional: manejar el caso de que la cotización no se encuentre
          console.error("Cotización no encontrada");
        }
      } catch (error) {
        console.error("Error al cargar la cotización:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCotizacion();
  }, [id]);

  if (loading) {
    return <div className="p-6">Cargando cotización...</div>;
  }

  if (!cotizacion) {
    return <div className="p-6">Cotización no encontrada.</div>;
  }

  const { subtotal, totalDescuentos } = cotizacion.items.reduce(
    (acc, item) => {
      const itemTotal = item.precio * item.cantidad;
      let subtotalConDescuentos = itemTotal;

      cotizacion.descuentos.forEach(d => {
        if (d !== undefined && d > 0) {
          subtotalConDescuentos = subtotalConDescuentos * (1 - d / 100);
        }
      });
      
      acc.subtotal += itemTotal;
      acc.totalDescuentos += itemTotal - subtotalConDescuentos;
      
      return acc;
    },
    { subtotal: 0, totalDescuentos: 0 }
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button onClick={() => generarCotizacionPDF(cotizacion)}>
            <Printer className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md border">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Cotización</h1>
              <p className="text-sm text-gray-500 mt-1">Folio: <span className="font-mono">{cotizacion.id.substring(0, 7)}</span></p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Liqui Moly Sales Hub</p>
              <p className="text-sm text-gray-600">Fecha: {format(cotizacion.fecha.toDate(), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          {/* Cliente Info */}
          <div className="py-6">
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">Cliente</h2>
            <p className="font-bold text-gray-800">{cotizacion.clienteNombre}</p>
            {/* Aquí podrías agregar más detalles del cliente si los tuvieras */}
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Cant.</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">P. Unitario</th>
                  <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.items.map(item => (
                  <tr key={item.productoId} className="border-t">
                    <td className="p-3 text-sm text-gray-500 font-mono">{item.codigo}</td>
                    <td className="p-3 text-sm font-semibold text-gray-800">{item.nombre}</td>
                    <td className="p-3 text-sm text-center text-gray-600">{item.cantidad}</td>
                    <td className="p-3 text-sm text-right text-gray-600">${item.precio.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right font-medium text-gray-800">${(item.precio * item.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              
              {cotizacion.descuentos.map((d, i) => {
                if(d !== undefined && d > 0) {
                    return (
                        <div key={i} className="flex justify-between">
                            <span className="text-sm text-gray-600">Descuento {i + 1} ({d}%)</span>
                        </div>
                    )
                }
                return null;
              })}

               <div className="flex justify-between text-red-600">
                <span className="text-sm">Total Descuentos</span>
                <span className="text-sm font-medium">-${totalDescuentos.toFixed(2)}</span>
              </div>

              <div className="border-t my-2"></div>

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>${cotizacion.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
