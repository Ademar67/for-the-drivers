'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Eye, Trash2 } from 'lucide-react';
import { listenCotizaciones, eliminarCotizacion, type CotizacionFS } from '@/lib/firestore/cotizaciones';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0));
}

function formatFecha(fecha: any) {
  try {
    const date =
      typeof fecha?.toDate === 'function' ? fecha.toDate() : new Date(fecha);

    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Sin fecha';
  }
}

export default function CotizacionesPage() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<CotizacionFS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    try {
      unsub = listenCotizaciones((data) => {
        setCotizaciones(data);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
      setCotizaciones([]);
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const resumen = useMemo(() => {
    return cotizaciones.reduce(
      (acc, cot) => {
        acc.total += 1;
        acc.monto += Number(cot.total || 0);
        const estado = (cot as any).estado ?? 'pendiente';
        if (estado === 'aceptada') acc.aceptadas += 1;
        if (estado === 'pendiente') acc.pendientes += 1;
        return acc;
      },
      { total: 0, monto: 0, aceptadas: 0, pendientes: 0 }
    );
  }, [cotizaciones]);

  const handleEliminar = async (id: string) => {
    try {
      await eliminarCotizacion(id);
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar la cotizacion.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
                <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta tus cotizaciones guardadas y crea nuevas propuestas comerciales.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="rounded-xl">
            <Link href="/cotizaciones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva cotización
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Total cotizaciones</p>
          <p className="mt-2 text-2xl font-bold">{resumen.total}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Monto acumulado</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(resumen.monto)}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Promedio por cotización</p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(resumen.total > 0 ? resumen.monto / resumen.total : 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-green-50 p-4 shadow-sm ring-1 ring-green-200">
          <p className="text-sm text-green-700">Aceptadas</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{resumen.aceptadas}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-4 shadow-sm ring-1 ring-orange-200">
          <p className="text-sm text-orange-700">Pendientes</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">{resumen.pendientes}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Listado</h2>
            <p className="text-sm text-slate-500">
              Solo estás viendo tus cotizaciones.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            Cargando cotizaciones...
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-slate-50 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Aún no hay cotizaciones</h3>
            <p className="mt-1 text-sm text-slate-500">
              Crea tu primera cotización para comenzar.
            </p>

            <div className="mt-4">
              <Button asChild className="rounded-xl">
                <Link href="/cotizaciones/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva cotización
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4 md:hidden">
              {cotizaciones.map((cot) => (
                <div
                  key={cot.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800">
                        {cot.clienteNombre || 'Sin cliente'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatFecha(cot.createdAt)}
                      </p>
                    </div>

<div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">
                        {Array.isArray(cot.items) ? cot.items.length : 0} productos
                      </Badge>
                      {(() => {
                        const estado = (cot as any).estado ?? 'pendiente';
                        const map: Record<string, string> = {
                          pendiente: 'bg-slate-100 text-slate-600',
                          enviada: 'bg-blue-100 text-blue-700',
                          aceptada: 'bg-green-100 text-green-700',
                          rechazada: 'bg-red-100 text-red-700',
                        };
                        return (
                          <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${map[estado] ?? map.pendiente}`}>
                            {estado}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Subtotal</p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(cot.subtotal || 0)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Total</p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(cot.total || 0)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Descuentos</p>
                      <p className="mt-1 font-medium text-red-600">
                        -{formatCurrency(cot.totalDescuentos || 0)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Vigencia</p>
                      <p className="mt-1 font-medium">
                        {cot.vigenciaDias || 7} días
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <Button asChild variant="outline" className="w-full rounded-xl">
                      <Link href={`/cotizaciones/${cot.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 hidden overflow-hidden rounded-2xl border md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-4 text-left text-sm font-semibold">Cliente</th>
                    <th className="p-4 text-left text-sm font-semibold">Fecha</th>
                    <th className="p-4 text-left text-sm font-semibold">Productos</th>
                    <th className="p-4 text-left text-sm font-semibold">Subtotal</th>
                    <th className="p-4 text-left text-sm font-semibold">Descuentos</th>
                    <th className="p-4 text-left text-sm font-semibold">Total</th>
                    <th className="p-4 text-left text-sm font-semibold">Estado</th>
                    <th className="p-4 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id} className="border-t hover:bg-slate-50/70">
                      <td className="p-4 font-medium">
                        {cot.clienteNombre || 'Sin cliente'}
                      </td>
                      <td className="p-4">{formatFecha(cot.createdAt)}</td>
                      <td className="p-4">
                        {Array.isArray(cot.items) ? cot.items.length : 0}
                      </td>
                      <td className="p-4">{formatCurrency(cot.subtotal || 0)}</td>
                      <td className="p-4 text-red-600">
                        -{formatCurrency(cot.totalDescuentos || 0)}
                      </td>
                      <td className="p-4 font-semibold">
                        {formatCurrency(cot.total || 0)}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const estado = (cot as any).estado ?? 'pendiente';
                          const map: Record<string, string> = {
                            pendiente: 'bg-slate-100 text-slate-600',
                            enviada: 'bg-blue-100 text-blue-700',
                            aceptada: 'bg-green-100 text-green-700',
                            rechazada: 'bg-red-100 text-red-700',
                          };
                          return (
                            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${map[estado] ?? map.pendiente}`}>
                              {estado}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href={`/cotizaciones/${cot.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar cotizacion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta accion no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (!cot.id) return;
                                    handleEliminar(cot.id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}