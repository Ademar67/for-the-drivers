'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  StickyNote,
  Trash2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
} from 'lucide-react';

import {
  listenClientes,
  ClienteFS,
  cambiarTipoCliente,
  eliminarCliente,
  marcarVisitaProspecto,
  programarSeguimientoProspecto,
} from '@/lib/firestore/clientes';

import { obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import { cn } from '@/lib/utils';

import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import DenueSearchModal from '@/components/denue/DenueSearchModal';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

/* ------------------ reglas de salud ------------------ */

const NUEVO_OK = 7;
const NUEVO_RIESGO = 21;
const CONTACTO_OK = 14;
const CONTACTO_RIESGO = 30;
const DIAS_SEGUIMIENTO = 22;

function getSaludProspecto({
  fechaCreacion,
  ultimaVisita,
}: {
  fechaCreacion?: Date;
  ultimaVisita?: Date;
}) {
  const hoy = new Date();
  const base = ultimaVisita ?? fechaCreacion;
  if (!base) return { estado: 'activo', texto: 'Sin información' };

  const dias = Math.floor(
    (hoy.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (!ultimaVisita) {
    if (dias < NUEVO_OK) return { estado: 'activo', texto: 'Nunca contactado' };
    if (dias < NUEVO_RIESGO)
      return { estado: 'riesgo', texto: `Sin contacto ${dias} días` };
    return { estado: 'perdido', texto: `Sin contacto ${dias} días` };
  }

  if (dias < CONTACTO_OK)
    return { estado: 'activo', texto: `Último contacto ${dias} días` };
  if (dias < CONTACTO_RIESGO)
    return { estado: 'riesgo', texto: `Sin contacto ${dias} días` };
  return { estado: 'perdido', texto: `Sin contacto ${dias} días` };
}

function formatearFecha(fecha?: any) {
  if (!fecha) return 'Sin fecha';

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

function getEstadoProspectoLabel(estado?: ClienteFS['estadoProspecto']) {
  switch (estado) {
    case 'nuevo':
      return 'Nuevo';
    case 'visitado':
      return 'Visitado';
    case 'seguimiento':
      return 'Seguimiento';
    case 'interesado':
      return 'Interesado';
    case 'no_interesado':
      return 'No interesado';
    default:
      return 'Nuevo';
  }
}

function getEstadoProspectoClass(estado?: ClienteFS['estadoProspecto']) {
  switch (estado) {
    case 'nuevo':
      return 'bg-blue-100 text-blue-700';
    case 'visitado':
      return 'bg-green-100 text-green-700';
    case 'seguimiento':
      return 'bg-orange-100 text-orange-700';
    case 'interesado':
      return 'bg-emerald-100 text-emerald-700';
    case 'no_interesado':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

/* ------------------ página ------------------ */

export default function ProspectosPage() {
  const [prospectos, setProspectos] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const [crearOpen, setCrearOpen] = useState(false);
  const [nota, setNota] = useState<string | null>(null);
  const [convirtiendoId, setConvirtiendoId] = useState<string | null>(null);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [seguimientoId, setSeguimientoId] = useState<string | null>(null);

  const [denueOpen, setDenueOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    const unsub = listenClientes((clientes) => {
      setProspectos(clientes.filter((c) => c.tipo === 'prospecto'));
      setLoading(false);
    });

    obtenerVisitas().then(setVisitas);

    return () => unsub();
  }, []);

  const ultimaVisitaMap = useMemo(() => {
    const map = new Map<string, Date>();

    visitas.forEach((v) => {
      const d = new Date(v.fecha);
      const actual = map.get(v.clienteId);
      if (!actual || d > actual) map.set(v.clienteId, d);
    });

    return map;
  }, [visitas]);

  const buscarDenue = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setDenueOpen(true);
      },
      () => {
        alert(
          'No se pudo obtener tu ubicación. Da permisos de ubicación al navegador.'
        );
      }
    );
  };

  const convertir = async (id: string) => {
    try {
      setConvirtiendoId(id);
      await cambiarTipoCliente(id, 'cliente');
    } catch (error) {
      console.error(error);
      alert('No se pudo convertir el prospecto a cliente');
    } finally {
      setConvirtiendoId(null);
    }
  };

  const marcarVisita = async (id: string) => {
    try {
      setMarcandoId(id);
      await marcarVisitaProspecto(id);
    } catch (error) {
      console.error(error);
      alert('No se pudo marcar la visita');
    } finally {
      setMarcandoId(null);
    }
  };

  const programarSeguimiento22Dias = async (id: string) => {
    try {
      setSeguimientoId(id);

      const fecha = new Date();
      fecha.setDate(fecha.getDate() + DIAS_SEGUIMIENTO);

      await programarSeguimientoProspecto(id, fecha);
    } catch (error) {
      console.error(error);
      alert('No se pudo programar el seguimiento');
    } finally {
      setSeguimientoId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prospectos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={buscarDenue}>
            <MapPin className="h-4 w-4 mr-2" />
            Buscar Cercanos
          </Button>
          <Button onClick={() => setCrearOpen(true)}>+ Agregar Prospecto</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 italic">Cargando...</p>
      ) : prospectos.length === 0 ? (
        <p className="text-gray-500 italic text-center">
          No hay prospectos registrados
        </p>
      ) : (
        <div className="grid gap-4">
          {prospectos.map((p) => {
            const ultimaVisitaReal =
              p.ultimaVisita?.toDate?.() ??
              (p.id ? ultimaVisitaMap.get(p.id) : undefined);

            const salud = getSaludProspecto({
              fechaCreacion: p.createdAt?.toDate?.(),
              ultimaVisita: ultimaVisitaReal,
            });

            return (
              <div
                key={p.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{p.nombre}</h3>
                    <p className="text-sm text-gray-500 mt-1">{salud.texto}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        salud.estado === 'activo' &&
                          'bg-green-100 text-green-700',
                        salud.estado === 'riesgo' &&
                          'bg-orange-100 text-orange-700',
                        salud.estado === 'perdido' &&
                          'bg-red-100 text-red-700'
                      )}
                    >
                      {salud.estado}
                    </span>

                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        getEstadoProspectoClass(p.estadoProspecto)
                      )}
                    >
                      {getEstadoProspectoLabel(p.estadoProspecto)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Ciudad:</span>{' '}
                    {p.ciudad || 'Sin ciudad'}
                  </p>
                  <p>
                    <span className="font-medium">Domicilio:</span>{' '}
                    {p.domicilio || 'Sin domicilio'}
                  </p>
                  <p>
                    <span className="font-medium">Última visita:</span>{' '}
                    {ultimaVisitaReal
                      ? formatearFecha(ultimaVisitaReal)
                      : 'Sin visitas'}
                  </p>
                  <p>
                    <span className="font-medium">Próxima visita:</span>{' '}
                    {p.proximaVisita
                      ? formatearFecha(p.proximaVisita)
                      : 'Sin programar'}
                  </p>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNota(p.nota || '')}
                  >
                    <StickyNote className="h-4 w-4 mr-1" />
                    Nota
                  </Button>

                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/agenda?clienteId=${p.id}`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Agenda
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => p.id && marcarVisita(p.id)}
                    disabled={marcandoId === p.id}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    {marcandoId === p.id ? 'Guardando...' : 'Marcar visita'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => p.id && programarSeguimiento22Dias(p.id)}
                    disabled={seguimientoId === p.id}
                  >
                    <Clock3 className="h-4 w-4 mr-1" />
                    {seguimientoId === p.id
                      ? 'Programando...'
                      : `Seguimiento +${DIAS_SEGUIMIENTO} días`}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={convirtiendoId === p.id}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Convertir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Convertir a cliente?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {p.nombre} pasará a Clientes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => p.id && convertir(p.id)}
                        >
                          Convertir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => p.id && eliminarCliente(p.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CrearClienteModal open={crearOpen} onClose={() => setCrearOpen(false)} />

      <DenueSearchModal
        open={denueOpen}
        onClose={() => setDenueOpen(false)}
        coords={coords}
      />

      <Dialog open={nota !== null} onOpenChange={() => setNota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm">{nota}</p>
          <DialogFooter>
            <Button onClick={() => setNota(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}