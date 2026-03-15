'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import {
  FileText,
  Phone,
  Mail,
  MapPin,
  User,
  CalendarDays,
  BadgeDollarSign,
  NotebookPen,
  Activity,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import type { ClienteFS } from '@/lib/firestore/clientes';
import type { Cotizacion } from '@/lib/firestore/cotizaciones';

export default function ClienteDetailClient({ id }: { id: string }) {
  const [cliente, setCliente] = useState<ClienteFS | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);

        const docRef = doc(db, 'clientes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCliente({ id: docSnap.id, ...docSnap.data() } as ClienteFS);
        } else {
          setCliente(null);
        }

        const q = collection(db, 'cotizaciones');
        const querySnapshot = await getDocs(q);

        const cots = querySnapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Cotizacion))
          .filter((c) => c.clienteId === id)
          .sort((a, b) => {
            const aTime = a.fecha_creacion?.seconds ?? 0;
            const bTime = b.fecha_creacion?.seconds ?? 0;
            return bTime - aTime;
          });

        setCotizaciones(cots);
      } catch (error) {
        console.error('Error cargando detalle del cliente:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  const handleViewPDF = (cotizacionId: string) => {
    window.open(`/api/cotizaciones/pdf?id=${encodeURIComponent(cotizacionId)}`, '_blank');
  };

  const ultimaCotizacion = cotizaciones[0] ?? null;

  const resumen = useMemo(() => {
    const totalCotizado = cotizaciones.reduce(
      (acc, cot) => acc + Number(cot.total ?? 0),
      0
    );

    return {
      totalCotizaciones: cotizaciones.length,
      totalCotizado,
      ticketPromedio:
        cotizaciones.length > 0 ? totalCotizado / cotizaciones.length : 0,
    };
  }, [cotizaciones]);

  const estadoActual = (() => {
    const estadoProspecto = (cliente as any)?.estadoProspecto;
    const tipo = (cliente as any)?.tipo;

    if (estadoProspecto) return estadoProspecto;
    if (tipo) return tipo;
    return 'Activo';
  })();

  const ultimoContacto = (() => {
    const fechaCliente =
      (cliente as any)?.updatedAt?.seconds ||
      (cliente as any)?.fechaActualizacion?.seconds ||
      (cliente as any)?.ultimoContacto?.seconds ||
      0;

    const fechaCotizacion = ultimaCotizacion?.fecha_creacion?.seconds ?? 0;

    const finalDate = Math.max(fechaCliente, fechaCotizacion);

    if (!finalDate) return 'Sin registro';

    return new Date(finalDate * 1000).toLocaleDateString();
  })();

  const notasCliente =
    (cliente as any)?.notas ||
    (cliente as any)?.observaciones ||
    (cliente as any)?.comentarios ||
    '';

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!cliente) {
    return <div className="p-6">Cliente no encontrado.</div>;
  }

  return (
    <div className="min-h-screen space-y-6 bg-background p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Historial comercial y resumen del cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              Información del cliente
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">
                    {cliente.email || 'Sin email'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Teléfono</p>
                  <p className="text-muted-foreground">
                    {cliente.telefono || 'Sin teléfono'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Domicilio</p>
                  <p className="text-muted-foreground">
                    {cliente.domicilio || 'Sin domicilio'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5" />
              Estado actual
            </h2>

            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Estado
                </p>
                <p className="mt-1 text-base font-semibold capitalize">
                  {String(estadoActual)}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Último contacto
                </p>
                <p className="mt-1 text-base font-semibold">{ultimoContacto}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <NotebookPen className="h-5 w-5" />
              Notas
            </h2>

            {notasCliente ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {notasCliente}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este cliente todavía no tiene notas registradas.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Cotizaciones
                </p>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>

              <p className="text-3xl font-bold">{resumen.totalCotizaciones}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Total de cotizaciones registradas
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Total cotizado
                </p>
                <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
              </div>

              <p className="text-3xl font-bold">
                ${resumen.totalCotizado.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Acumulado histórico cotizado
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Ticket promedio
                </p>
                <CalendarDays className="h-5 w-5 text-violet-600" />
              </div>

              <p className="text-3xl font-bold">
                ${resumen.ticketPromedio.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Promedio por cotización
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Últimas cotizaciones</h2>

            {cotizaciones.length > 0 ? (
              <div className="space-y-4">
                {cotizaciones.slice(0, 5).map((cot) => (
                  <div
                    key={cot.id}
                    className="rounded-2xl border bg-background p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">Folio: {cot.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Fecha:{' '}
                          {cot.fecha_creacion
                            ? new Date(
                                cot.fecha_creacion.seconds * 1000
                              ).toLocaleDateString()
                            : 'Sin fecha'}
                        </p>
                        <p className="text-sm">
                          Total:{' '}
                          <span className="font-semibold">
                            ${Number(cot.total ?? 0).toFixed(2)}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewPDF(cot.id)}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Ver PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No hay cotizaciones para este cliente.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-dashed bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Siguiente mejora</h2>
            <p className="text-sm text-muted-foreground">
              Aquí después podemos conectar:
            </p>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>• Últimas visitas</p>
              <p>• Productos que más compra</p>
              <p>• Próximo seguimiento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}