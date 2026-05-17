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
  Users,
  AlertTriangle,
  Sparkles,
  Filter,
  Phone,
  MessageCircle,
  Navigation,
  Search,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthProvider';

import {
  ClienteFS,
  cambiarTipoCliente,
  eliminarCliente,
  marcarVisitaProspecto,
  programarSeguimientoProspecto,
} from '@/lib/firestore/clientes';

import type { Visita } from '@/lib/firestore/visitas';
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

type FiltroProspectos =
  | 'todos'
  | 'para_hoy'
  | 'vencidos'
  | 'nuevo'
  | 'seguimiento'
  | 'interesado';

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

function esMismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inicioDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ------------------ página ------------------ */

export default function ProspectosPage() {
  const { user, loading: authLoading } = useAuth();

  const [prospectos, setProspectos] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const [crearOpen, setCrearOpen] = useState(false);
  const [nota, setNota] = useState<string | null>(null);
  const [convirtiendoId, setConvirtiendoId] = useState<string | null>(null);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [seguimientoId, setSeguimientoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroProspectos>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [denueOpen, setDenueOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProspectos([]);
      setVisitas([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const prospectosRef = collection(db, 'clientes');
    const prospectosQuery = query(
      prospectosRef,
      where('ownerId', '==', user.uid),
      where('tipo', '==', 'prospecto')
    );

    const visitasRef = collection(db, 'visitas');
    const visitasQuery = query(visitasRef, where('ownerId', '==', user.uid));

    let prospectosReady = false;
    let visitasReady = false;

    const unsubProspectos = onSnapshot(
      prospectosQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data() as Omit<ClienteFS, 'id'>;
          return {
            id: doc.id,
            ...d,
          } as ClienteFS;
        });

        data.sort((a, b) => {
          const aTime =
            typeof (a as any).createdAt?.toMillis === 'function'
              ? (a as any).createdAt.toMillis()
              : 0;
          const bTime =
            typeof (b as any).createdAt?.toMillis === 'function'
              ? (b as any).createdAt.toMillis()
              : 0;

          return bTime - aTime;
        });

        setProspectos(data);
        prospectosReady = true;
        if (visitasReady) setLoading(false);
      },
      (error) => {
        console.error('Error cargando prospectos:', error);
        setProspectos([]);
        prospectosReady = true;
        if (visitasReady) setLoading(false);
      }
    );

    const unsubVisitas = onSnapshot(
      visitasQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Visita, 'id'>),
        })) as Visita[];

        setVisitas(data);
        visitasReady = true;
        if (prospectosReady) setLoading(false);
      },
      (error) => {
        console.error('Error cargando visitas:', error);
        setVisitas([]);
        visitasReady = true;
        if (prospectosReady) setLoading(false);
      }
    );

    return () => {
      unsubProspectos();
      unsubVisitas();
    };
  }, [user, authLoading]);

  const ultimaVisitaMap = useMemo(() => {
    const map = new Map<string, Date>();

    visitas.forEach((v) => {
      const d = new Date(v.fecha);
      if (Number.isNaN(d.getTime())) return;

      const actual = map.get(v.clienteId);
      if (!actual || d > actual) map.set(v.clienteId, d);
    });

    return map;
  }, [visitas]);

  const hoy = useMemo(() => inicioDelDia(new Date()), []);

  const prospectosEnriquecidos = useMemo(() => {
    return prospectos.map((p) => {
      const ultimaVisitaReal =
        p.ultimaVisita?.toDate?.() ??
        (p.id ? ultimaVisitaMap.get(p.id) : undefined);

      const proximaVisitaReal = p.proximaVisita?.toDate?.()
        ? p.proximaVisita.toDate()
        : undefined;

      const salud = getSaludProspecto({
        fechaCreacion: p.createdAt?.toDate?.(),
        ultimaVisita: ultimaVisitaReal,
      });

      const esParaHoy = !!proximaVisitaReal && esMismoDia(proximaVisitaReal, hoy);
      const esVencido = !!proximaVisitaReal && inicioDelDia(proximaVisitaReal) < hoy;

      return {
        ...p,
        ultimaVisitaReal,
        proximaVisitaReal,
        salud,
        esParaHoy,
        esVencido,
      };
    });
  }, [prospectos, ultimaVisitaMap, hoy]);

  const resumen = useMemo(() => {
    return {
      total: prospectosEnriquecidos.length,
      paraHoy: prospectosEnriquecidos.filter((p) => p.esParaHoy).length,
      vencidos: prospectosEnriquecidos.filter((p) => p.esVencido).length,
      nuevos: prospectosEnriquecidos.filter((p) => p.estadoProspecto === 'nuevo')
        .length,
      seguimiento: prospectosEnriquecidos.filter(
        (p) => p.estadoProspecto === 'seguimiento'
      ).length,
    };
  }, [prospectosEnriquecidos]);

  const prospectosFiltrados = useMemo(() => {
    let filtrados = [...prospectosEnriquecidos];
  
    switch (filtro) {
      case 'para_hoy':
        filtrados = filtrados.filter((p) => p.esParaHoy);
        break;
  
      case 'vencidos':
        filtrados = filtrados.filter((p) => p.esVencido);
        break;
  
      case 'nuevo':
        filtrados = filtrados.filter(
          (p) => p.estadoProspecto === 'nuevo'
        );
        break;
  
      case 'seguimiento':
        filtrados = filtrados.filter(
          (p) => p.estadoProspecto === 'seguimiento'
        );
        break;
  
      case 'interesado':
        filtrados = filtrados.filter(
          (p) => p.estadoProspecto === 'interesado'
        );
        break;
    }
  
    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();
  
      filtrados = filtrados.filter((p) => {
        return (
          p.nombre?.toLowerCase().includes(texto) ||
          p.ciudad?.toLowerCase().includes(texto) ||
          p.telefono?.toLowerCase().includes(texto)
        );
      });
    }
  
    return filtrados;
  }, [filtro, prospectosEnriquecidos, busqueda]);

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

  if (authLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="italic text-slate-500">Cargando prospectos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospectos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Da seguimiento comercial, detecta prioridades y convierte oportunidades en clientes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <Button variant="outline" onClick={buscarDenue} className="rounded-xl">
            <MapPin className="mr-2 h-4 w-4" />
            Buscar Cercanos
          </Button>
          <Button onClick={() => setCrearOpen(true)} className="rounded-xl">
            + Agregar Prospecto
          </Button>
        </div>
      </div>

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === 'todos' && 'ring-2 ring-slate-400'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total</p>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{resumen.total}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('para_hoy')}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === 'para_hoy' && 'ring-2 ring-blue-500'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Para hoy</p>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{resumen.paraHoy}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('vencidos')}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === 'vencidos' && 'ring-2 ring-red-500'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Vencidos</p>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{resumen.vencidos}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('nuevo')}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === 'nuevo' && 'ring-2 ring-blue-500'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Nuevos</p>
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{resumen.nuevos}</p>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('seguimiento')}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === 'seguimiento' && 'ring-2 ring-orange-500'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Seguimiento</p>
              <Clock3 className="h-5 w-5 text-orange-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{resumen.seguimiento}</p>
          </button>
        </div>
      )}

{!loading && (
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        type="text"
        placeholder="Buscar prospecto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500"
      />
    </div>
  </div>
)}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Filter className="h-5 w-5" />
                Filtros
              </h2>
              <p className="text-sm text-slate-500">
                Enfócate en lo urgente y organiza mejor tu seguimiento.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filtro === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('todos')}
                className="rounded-xl"
              >
                Todos
              </Button>
              <Button
                variant={filtro === 'para_hoy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('para_hoy')}
                className="rounded-xl"
              >
                Para hoy
              </Button>
              <Button
                variant={filtro === 'vencidos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('vencidos')}
                className="rounded-xl"
              >
                Vencidos
              </Button>
              <Button
                variant={filtro === 'nuevo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('nuevo')}
                className="rounded-xl"
              >
                Nuevos
              </Button>
              <Button
                variant={filtro === 'seguimiento' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('seguimiento')}
                className="rounded-xl"
              >
                Seguimiento
              </Button>
              <Button
                variant={filtro === 'interesado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltro('interesado')}
                className="rounded-xl"
              >
                Interesados
              </Button>
            </div>
          </div>
        </section>
      

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="italic text-slate-500">Cargando prospectos...</p>
        </div>
      ) : prospectosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <h3 className="text-lg font-semibold">No hay prospectos para este filtro</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ajusta el filtro o agrega un nuevo prospecto para continuar.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            {prospectosFiltrados.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                  <Link
  href={`/prospectos/${p.id}`}
  className="text-lg font-bold text-slate-800 hover:text-blue-600"
>
  {p.nombre}
</Link>
                    <p className="mt-1 text-sm text-slate-500">{p.salud.texto}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        p.salud.estado === 'activo' &&
                          'bg-green-100 text-green-700',
                        p.salud.estado === 'riesgo' &&
                          'bg-orange-100 text-orange-700',
                        p.salud.estado === 'perdido' &&
                          'bg-red-100 text-red-700'
                      )}
                    >
                      {p.salud.estado}
                    </span>

                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        getEstadoProspectoClass(p.estadoProspecto)
                      )}
                    >
                      {getEstadoProspectoLabel(p.estadoProspecto)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.esParaHoy && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      Para hoy
                    </span>
                  )}

                  {p.esVencido && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                      Vencido
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Ciudad</p>
                    <p className="mt-1 font-medium">{p.ciudad || 'Sin ciudad'}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Última visita</p>
                    <p className="mt-1 font-medium">
                      {p.ultimaVisitaReal
                        ? formatearFecha(p.ultimaVisitaReal)
                        : 'Sin visitas'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-slate-500">Domicilio</p>
                    <p className="mt-1 font-medium">
                      {p.domicilio || 'Sin domicilio'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-slate-500">Próxima visita</p>
                    <p className="mt-1 font-medium">
                      {p.proximaVisitaReal
                        ? formatearFecha(p.proximaVisitaReal)
                        : 'Sin programar'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <div className="grid grid-cols-3 gap-2">
  <a
    href={`tel:${p.telefono || ''}`}
    className="flex items-center justify-center rounded-xl border bg-white py-2 text-sm font-medium"
  >
    <Phone className="mr-1 h-4 w-4" />
    Llamar
  </a>

  <a
    href={`https://wa.me/52${String(p.telefono || '').replace(/\D/g, '')}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center rounded-xl border bg-white py-2 text-sm font-medium"
  >
    <MessageCircle className="mr-1 h-4 w-4" />
    WhatsApp
  </a>

  <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      p.domicilio || p.nombre || ''
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center rounded-xl border bg-white py-2 text-sm font-medium"
  >
    <Navigation className="mr-1 h-4 w-4" />
    Ruta
  </a>
</div>
<Button
  size="sm"
  asChild
  className="rounded-xl bg-blue-600 hover:bg-blue-700"
>
  <Link href={`/cotizaciones/nueva?clienteId=${p.id}`}>
    Cotizar
  </Link>
</Button>

<div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNota(p.nota || '')}
                      className="rounded-xl"
                    >
                      <StickyNote className="mr-1 h-4 w-4" />
                      Nota
                    </Button>

                    <Button size="sm" variant="outline" asChild className="rounded-xl">
                      <Link href={`/agenda?clienteId=${p.id}`}>
                        <Calendar className="mr-1 h-4 w-4" />
                        Agenda
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => p.id && marcarVisita(p.id)}
                      disabled={marcandoId === p.id}
                      className="rounded-xl"
                    >
                      <ClipboardCheck className="mr-1 h-4 w-4" />
                      {marcandoId === p.id ? 'Guardando...' : 'Marcar visita'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => p.id && programarSeguimiento22Dias(p.id)}
                      disabled={seguimientoId === p.id}
                      className="rounded-xl"
                    >
                      <Clock3 className="mr-1 h-4 w-4" />
                      {seguimientoId === p.id
                        ? 'Programando...'
                        : `Seguimiento +${DIAS_SEGUIMIENTO} días`}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="rounded-xl bg-green-600 hover:bg-green-700"
                          disabled={convirtiendoId === p.id}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Convertir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Convertir a cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {p.nombre} pasará a Clientes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => p.id && convertir(p.id)}>
                            Convertir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-xl"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar prospecto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente a {p.nombre}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => p.id && eliminarCliente(p.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden gap-4 md:grid">
  {prospectosFiltrados.map((p) => (
    <div
      key={p.id}
      className="rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Link
          href={`/prospectos/${p.id}`}
          className="text-lg font-semibold hover:text-blue-600"
        >
          {p.nombre}
        </Link>

        <p className="mt-1 text-sm text-slate-500">
          {p.salud.texto}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs',
            p.salud.estado === 'activo' &&
              'bg-green-100 text-green-700',
            p.salud.estado === 'riesgo' &&
              'bg-orange-100 text-orange-700',
            p.salud.estado === 'perdido' &&
              'bg-red-100 text-red-700'
          )}
        >
                      {p.salud.estado}
                    </span>

                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        getEstadoProspectoClass(p.estadoProspecto)
                      )}
                    >
                      {getEstadoProspectoLabel(p.estadoProspecto)}
                    </span>

                    {p.esParaHoy && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        Para hoy
                      </span>
                    )}

                    {p.esVencido && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                        Vencido
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-500">Ciudad</p>
                    <p className="mt-1 font-medium">{p.ciudad || 'Sin ciudad'}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-500">Última visita</p>
                    <p className="mt-1 font-medium">
                      {p.ultimaVisitaReal
                        ? formatearFecha(p.ultimaVisitaReal)
                        : 'Sin visitas'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-500">Próxima visita</p>
                    <p className="mt-1 font-medium">
                      {p.proximaVisitaReal
                        ? formatearFecha(p.proximaVisitaReal)
                        : 'Sin programar'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm text-slate-500">Estado comercial</p>
                    <p className="mt-1 font-medium">
                      {getEstadoProspectoLabel(p.estadoProspecto)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 lg:col-span-4">
                    <p className="text-sm text-slate-500">Domicilio</p>
                    <p className="mt-1 font-medium">
                      {p.domicilio || 'Sin domicilio'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNota(p.nota || '')}
                    className="rounded-xl"
                  >
                    <StickyNote className="mr-1 h-4 w-4" />
                    Nota
                  </Button>

                  <Button size="sm" variant="outline" asChild className="rounded-xl">
                    <Link href={`/agenda?clienteId=${p.id}`}>
                      <Calendar className="mr-1 h-4 w-4" />
                      Agenda
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => p.id && marcarVisita(p.id)}
                    disabled={marcandoId === p.id}
                    className="rounded-xl"
                  >
                    <ClipboardCheck className="mr-1 h-4 w-4" />
                    {marcandoId === p.id ? 'Guardando...' : 'Marcar visita'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => p.id && programarSeguimiento22Dias(p.id)}
                    disabled={seguimientoId === p.id}
                    className="rounded-xl"
                  >
                    <Clock3 className="mr-1 h-4 w-4" />
                    {seguimientoId === p.id
                      ? 'Programando...'
                      : `Seguimiento +${DIAS_SEGUIMIENTO} días`}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="rounded-xl bg-green-600 hover:bg-green-700"
                        disabled={convirtiendoId === p.id}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Convertir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Convertir a cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {p.nombre} pasará a Clientes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => p.id && convertir(p.id)}>
                          Convertir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar prospecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente a {p.nombre}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => p.id && eliminarCliente(p.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </>
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
            <Button onClick={() => setNota(null)} className="rounded-xl">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}