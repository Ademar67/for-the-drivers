'use client';

import { useEffect, useMemo, useState } from 'react';
import { listenClientes, ClienteFS, cambiarTipoCliente } from '@/lib/firestore/clientes';
import { obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Calendar, CheckCircle2, StickyNote } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

const PROSPECTO_NUEVO_OK = 7;
const PROSPECTO_NUEVO_RIESGO = 21;
const PROSPECTO_CONTACTO_OK = 14;
const PROSPECTO_CONTACTO_RIESGO = 30;

function getSaludProspecto({
  fechaCreacion,
  ultimaVisita,
  hoy,
}: {
  fechaCreacion: Date;
  ultimaVisita?: Date;
  hoy: Date;
}) {
  if (!ultimaVisita) {
    const dias = Math.floor(
      (hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dias < PROSPECTO_NUEVO_OK) {
      return { estado: 'activo', texto: 'Nunca contactado' };
    }
    if (dias < PROSPECTO_NUEVO_RIESGO) {
      return { estado: 'riesgo', texto: `Sin contacto hace ${dias} días` };
    }
    return { estado: 'perdido', texto: `Sin contacto hace ${dias} días` };
  }

  const dias = Math.floor(
    (hoy.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dias < PROSPECTO_CONTACTO_OK) {
    return { estado: 'activo', texto: `Último contacto hace ${dias} días` };
  }
  if (dias < PROSPECTO_CONTACTO_RIESGO) {
    return { estado: 'riesgo', texto: `Sin contacto hace ${dias} días` };
  }
  return { estado: 'perdido', texto: `Sin contacto hace ${dias} días` };
}

export default function ProspectosPage() {
  const [prospectos, setProspectos] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState<string | null>(null);
  const [convirtiendoId, setConvirtiendoId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenClientes((clientes) => {
      setProspectos(clientes.filter((c) => c.tipo === 'prospecto'));
      setLoading(false);
    });

    async function loadVisitas() {
      const visitasFromDb = await obtenerVisitas();
      setVisitas(visitasFromDb);
    }

    loadVisitas();

    return () => unsub();
  }, []);

  const ultimaVisitaMap = useMemo(() => {
    const map = new Map<string, Date>();
    visitas.forEach((v) => {
      const fechaVisita = new Date(v.fecha);
      const fechaExistente = map.get(v.clienteId);
      if (!fechaExistente || fechaVisita > fechaExistente) {
        map.set(v.clienteId, fechaVisita);
      }
    });
    return map;
  }, [visitas]);

  const convertirACliente = async (id: string) => {
    try {
      setConvirtiendoId(id);
      await cambiarTipoCliente(id, 'cliente');
      // La lista se actualiza sola por listenClientes
    } catch (error) {
      console.error('Error al convertir a cliente:', error);
      alert('No se pudo convertir a cliente.');
    } finally {
      setConvirtiendoId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Prospectos</h1>
        <Button onClick={() => setOpen(true)}>
          + Agregar Prospecto
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 italic">Cargando prospectos...</p>
      ) : prospectos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prospectos.map((prospecto) => {
            const salud = getSaludProspecto({
              fechaCreacion: prospecto.createdAt.toDate(),
              ultimaVisita: ultimaVisitaMap.get(prospecto.id!),
              hoy: new Date(),
            });

            return (
              <div
                key={prospecto.id}
                className="p-4 rounded-lg border bg-white shadow-sm flex flex-col"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{prospecto.nombre}</h3>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        salud.estado === 'activo' && 'bg-green-100 text-green-700',
                        salud.estado === 'riesgo' && 'bg-orange-100 text-orange-700',
                        salud.estado === 'perdido' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {salud.estado.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{salud.texto}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Ciudad: {prospecto.ciudad}
                  </div>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full md:w-auto"
                    onClick={() => setNotaSeleccionada(prospecto.nota || '')}
                  >
                    <StickyNote className="h-4 w-4" />
                    Ver Nota
                  </Button>

                  <Button asChild variant="outline" size="lg" className="w-full md:w-auto">
                    <Link
                      href={`/agenda?clienteId=${prospecto.id}`}
                    >
                      <Calendar className="h-4 w-4" />
                      Agenda
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="lg"
                        className="w-full md:w-auto text-base"
                        disabled={convirtiendoId === prospecto.id}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {convirtiendoId === prospecto.id ? 'Convirtiendo...' : 'Pasar a Cliente'}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Convertir a cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Seguro que quieres convertir a <b>{prospecto.nombre}</b> a <b>CLIENTE</b>?
                          <br />
                          Esto lo moverá automáticamente de Prospectos a Clientes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => convertirACliente(prospecto.id!)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Sí, convertir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">No hay prospectos.</p>
      )}

      <Dialog
        open={notaSeleccionada !== null}
        onOpenChange={(open) => !open && setNotaSeleccionada(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota del Prospecto</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {notaSeleccionada || 'Este prospecto no tiene ninguna nota.'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setNotaSeleccionada(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
