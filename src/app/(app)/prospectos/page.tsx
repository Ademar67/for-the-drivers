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
  LayoutGrid,
  List,
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
import PipelineKanban from '@/components/prospectos/PipelineKanban';

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

const NUEVO_OK = 7;
const NUEVO_RIESGO = 21;
const CONTACTO_OK = 14;
const CONTACTO_RIESGO = 30;

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

function getEstadoProspectoLabel(estado?: string) {
  switch (estado) {
    case 'nuevo': return 'Nuevo';
    case 'visitado': return 'Visitado';
    case 'seguimiento': return 'Seguimiento';
    case 'interesado': return 'Interesado';
    case 'no_interesado': return 'No interesado';
    default: return 'Nuevo';
  }
}

function getEstadoProspectoClass(estado?: string) {
  switch (estado) {
    case 'nuevo': return 'bg-blue-100 text-blue-700';
    case 'visitado': return 'bg-green-100 text-green-700';
    case 'seguimiento': return 'bg-orange-100 text-orange-700';
    case 'interesado': return 'bg-emerald-100 text-emerald-700';
    case 'no_interesado': return 'bg-gray-200 text-gray-700';
    default: return 'bg-blue-100 text-blue-700';
  }
}

function inicioDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function esMismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ProspectosPage() {
  const { user, loading: authLoading } = useAuth();

  const [prospectos, setProspectos] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const [crearOpen, setCrearOpen] = useState(false);
  const [nota, setNota] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroProspectos>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [denueOpen, setDenueOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vista, setVista] = useState<'lista' | 'pipeline'>('lista');

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
            typeof a.createdAt?.toMillis === "function"
              ? a.createdAt.toMillis()
              : 0;
          const bTime =
            typeof b.createdAt?.toMillis === "function"
              ? b.createdAt.toMillis()
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
      nuevos: prospectosEnriquecidos.filter((p) => p.estadoProspecto === 'nuevo').length,
      seguimiento: prospectosEnriquecidos.filter((p) => p.estadoProspecto === 'seguimiento').length,
    };
  }, [prospectosEnriquecidos]);

  const prospectosFiltrados = useMemo(() => {
    let filtrados = [...prospectosEnriquecidos];
    switch (filtro) {
      case 'para_hoy': filtrados = filtrados.filter((p) => p.esParaHoy); break;
      case 'vencidos': filtrados = filtrados.filter((p) => p.esVencido); break;
      case 'nuevo': filtrados = filtrados.filter((p) => p.estadoProspecto === 'nuevo'); break;
      case 'seguimiento': filtrados = filtrados.filter((p) => p.estadoProspecto === 'seguimiento'); break;
      case 'interesado': filtrados = filtrados.filter((p) => p.estadoProspecto === 'interesado'); break;
    }
    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();
      filtrados = filtrados.filter((p) =>
        p.nombre?.toLowerCase().includes(texto) ||
        p.ciudad?.toLowerCase().includes(texto) ||
        p.telefono?.toLowerCase().includes(texto)
      );
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
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDenueOpen(true);
      },
      () => alert('No se pudo obtener tu ubicación.')
    );
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar prospecto?')) return;
    try {
      await eliminarCliente(id);
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar.');
    }
  };

  if (authLoading) {
    return <div className="p-12 text-center text-slate-500">Cargando módulo de prospectos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospectos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Da seguimiento comercial, detecta prioridades y convierte oportunidades.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button variant="outline" onClick={buscarDenue} className="rounded-xl">
            <MapPin className="mr-2 h-4 w-4" /> Buscar Cercanos
          </Button>
          <Button onClick={() => setCrearOpen(true)} className="rounded-xl">
            + Agregar Prospecto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { key: 'todos', label: 'Total', count: resumen.total, icon: Users, color: 'ring-slate-400', textColor: 'text-slate-600' },
          { key: 'para_hoy', label: 'Para hoy', count: resumen.paraHoy, icon: Calendar, color: 'ring-blue-500', textColor: 'text-blue-600' },
          { key: 'vencidos', label: 'Vencidos', count: resumen.vencidos, icon: AlertTriangle, color: 'ring-red-500', textColor: 'text-red-600' },
          { key: 'nuevo', label: 'Nuevos', count: resumen.nuevos, icon: Sparkles, color: 'ring-blue-500', textColor: 'text-blue-600' },
          { key: 'seguimiento', label: 'Seguimiento', count: resumen.seguimiento, icon: Clock3, color: 'ring-orange-500', textColor: 'text-orange-600' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFiltro(item.key as FiltroProspectos)}
            className={cn(
              'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50',
              filtro === item.key && `ring-2 ${item.color}`
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">{item.label}</p>
              <item.icon className={cn("h-5 w-5", item.textColor)} />
            </div>
            <p className="mt-2 text-2xl font-bold">{item.count}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500 shadow-sm transition"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
          <button
            onClick={() => setVista('lista')}
            className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition', vista === 'lista' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100')}
          >
            <List className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setVista('pipeline')}
            className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition', vista === 'pipeline' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100')}
          >
            <LayoutGrid className="h-4 w-4" /> Pipeline
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 italic">Cargando prospectos...</div>
      ) : prospectosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-16 text-center shadow-sm">
          <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">No hay prospectos para este filtro</h3>
          <p className="text-sm text-slate-500 mt-1">Intenta con otro filtro o agrega un nuevo prospecto.</p>
        </div>
      ) : vista === 'pipeline' ? (
        <PipelineKanban prospectos={prospectosFiltrados as any} />
      ) : (
        <div className="grid gap-4">
          {prospectosFiltrados.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition hover:shadow-md">
              <div className="min-w-0">
                <Link href={`/prospectos/${p.id}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition truncate block">
                  {p.nombre}
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm', p.salud.estado === 'activo' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100')}>
                    {p.salud.texto}
                  </span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm', getEstadoProspectoClass(p.estadoProspecto))}>
                    {getEstadoProspectoLabel(p.estadoProspecto)}
                  </span>
                  {p.ciudad && <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{p.ciudad}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
                  <Link href={`/prospectos/${p.id}`}>Ficha</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <Link href={`/cotizaciones/nueva?clienteId=${p.id}`}>Cotizar</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => p.id && handleEliminar(p.id)} className="text-slate-400 hover:text-red-600 transition">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CrearClienteModal open={crearOpen} onClose={() => setCrearOpen(false)} />
      
      {denueOpen && (
        <DenueSearchModal 
          open={denueOpen} 
          onClose={() => setDenueOpen(false)} 
          coords={coords} 
        />
      )}

      <Dialog open={nota !== null} onOpenChange={() => setNota(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Nota de Seguimiento</DialogTitle></DialogHeader>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{nota}</p>
          </div>
          <DialogFooter><Button onClick={() => setNota(null)} className="rounded-xl w-full sm:w-auto">Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
