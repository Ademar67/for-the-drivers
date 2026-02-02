'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import {
  crearVisita,
  listenVisitas,
  Visita,
  eliminarVisita,
  marcarVisitaRealizada,
} from '@/lib/firestore/visitas';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { ChevronDown, PlusCircle, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import AgregarVisitaModal from '@/components/agenda/agregar-visita-modal';
import DenueSearchModal from '@/components/denue/DenueSearchModal';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const hoyIndex = new Date().getDay(); // 0 = Domingo, 1 = Lunes
const hoyDiaSemana = hoyIndex === 0 ? 'domingo' : DIAS_SEMANA[hoyIndex - 1];
const hoyFecha = new Date().toISOString().split('T')[0];
const PLAN_DIARIO_LIMITE = 6;

function getUrgenciaScore(
  clienteId: string,
  sets: {
    frecuenciaVencida: Set<string>;
    sinVisitaSemana: Set<string>;
  }
) {
  if (sets.frecuenciaVencida.has(clienteId)) return 0;
  if (sets.sinVisitaSemana.has(clienteId)) return 1;
  return 2;
}

function getTextoUrgencia(
  clienteId: string,
  data: {
    frecuenciaVencida: Set<string>;
    sinVisitaSemana: Set<string>;
    ultimaVisitaMap: Map<string, Date>;
    hoy: Date;
  }
) {
  if (data.frecuenciaVencida.has(clienteId)) {
    const ultimaVisita = data.ultimaVisitaMap.get(clienteId);

    if (!ultimaVisita) return null;

    const diffMs = data.hoy.getTime() - ultimaVisita.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return `Frecuencia vencida — hace ${dias} días`;
  }

  if (data.sinVisitaSemana.has(clienteId)) {
    return 'Sin visita esta semana';
  }

  return null;
}

function getDiasAtraso(clienteId: string, ultimaVisitaMap: Map<string, Date>, hoy: Date) {
  const ultimaVisita = ultimaVisitaMap.get(clienteId);
  if (!ultimaVisita) return Infinity;

  const diffMs = hoy.getTime() - ultimaVisita.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function AgendaView() {
  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get('clienteId');

  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCrearCliente, setOpenCrearCliente] = useState(false);
  const [openAgregarVisita, setOpenAgregarVisita] = useState(false);

  // Modal para marcar realizada + nota
  const [visitaParaMarcar, setVisitaParaMarcar] = useState<Visita | null>(null);
  const [notaVisita, setNotaVisita] = useState('');
  const [guardandoRealizada, setGuardandoRealizada] = useState(false);

  // Modal para búsqueda en DENUE
  const [denueSearchModalOpen, setDenueSearchModalOpen] = useState(false);
  const [denueSearchCoords, setDenueSearchCoords] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    const unsubClientes = listenClientes(setClientes);
    const unsubVisitas = listenVisitas((visitasFromDb) => {
      setVisitas(visitasFromDb);
      setLoading(false);
    });

    return () => {
      unsubClientes();
      unsubVisitas();
    };
  }, []);

  const handleSaveVisita = async (nuevaVisita: {
    clienteId: string;
    fecha: string;
    hora: string;
    tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
    notas: string;
  }) => {
    try {
      const clienteSeleccionado = clientes.find((c) => c.id === nuevaVisita.clienteId);
      if (!clienteSeleccionado) throw new Error('Cliente no encontrado');

      const visitaToSave = {
        ...nuevaVisita,
        cliente: clienteSeleccionado.nombre,
        estado: 'pendiente' as const,
      };

      await crearVisita(visitaToSave as any);
      // se actualiza sola por listener
    } catch (error) {
      console.error('ERROR AL GUARDAR VISITA:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido al guardar visita');
    }
  };

  const handleOpenMarcarRealizada = (visita: Visita) => {
    setVisitaParaMarcar(visita);
    setNotaVisita(visita.notas || '');
  };

  const handleConfirmarRealizada = async () => {
    if (!visitaParaMarcar?.id) return;

    const currentVisita = visitaParaMarcar;

    try {
      setGuardandoRealizada(true);
      await marcarVisitaRealizada(currentVisita.id, notaVisita);

      setVisitaParaMarcar(null);
      setNotaVisita('');

      const clienteDeVisita = clientes.find(c => c.id === currentVisita.clienteId);

      if (clienteDeVisita && clienteDeVisita.lat && clienteDeVisita.lng) {
        setDenueSearchCoords({ lat: clienteDeVisita.lat, lng: clienteDeVisita.lng });
        setDenueSearchModalOpen(true);
      }

    } catch (e) {
      console.error(e);
      alert('No se pudo marcar como realizada.');
    } finally {
      setGuardandoRealizada(false);
    }
  };

  const nombreClienteFiltrado = clienteIdFromUrl
    ? clientes.find((c) => c.id === clienteIdFromUrl)?.nombre
    : null;

  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

  const clientesActivos = clientes.filter((c) => c.tipo === 'cliente');

  const ultimaVisitaMap = new Map<string, Date>();
  visitas
    .filter((v) => v.estado === 'realizada')
    .forEach((v) => {
      const fechaVisita = new Date(v.fecha);
      const fechaExistente = ultimaVisitaMap.get(v.clienteId);
      if (!fechaExistente || fechaVisita > fechaExistente) {
        ultimaVisitaMap.set(v.clienteId, fechaVisita);
      }
    });

  const clientesSinVisitaReciente = clientesActivos.filter((cliente) => {
    const visitasDelCliente = visitas.filter((v) => v.clienteId === cliente.id);
    if (visitasDelCliente.length === 0) return true;

    const ultimaVisita = visitasDelCliente.reduce((masReciente, actual) =>
      new Date(actual.fecha) > new Date(masReciente.fecha) ? actual : masReciente
    );

    return new Date(ultimaVisita.fecha) < sieteDiasAtras;
  });

  const getFechaLimite = (ultimaFecha: Date, frecuencia: string) => {
    const fechaLimite = new Date(ultimaFecha);
    switch (frecuencia) {
      case 'semanal':
        fechaLimite.setDate(fechaLimite.getDate() + 7);
        break;
      case 'quincenal':
        fechaLimite.setDate(fechaLimite.getDate() + 15);
        break;
      case 'mensual':
        fechaLimite.setMonth(fechaLimite.getMonth() + 1);
        break;
      default:
        return new Date();
    }
    return fechaLimite;
  };

  const clientesVencidos = clientesActivos
    .filter((c) => c.frecuencia)
    .filter((cliente) => {
      const visitasRealizadas = visitas.filter(
        (v) => v.clienteId === cliente.id && v.estado === 'realizada'
      );

      if (visitasRealizadas.length === 0) return true;

      const ultimaVisita = visitasRealizadas.reduce((masReciente, actual) =>
        new Date(actual.fecha) > new Date(masReciente.fecha) ? actual : masReciente
      );

      const fechaLimite = getFechaLimite(new Date(ultimaVisita.fecha), cliente.frecuencia!);
      return new Date() > fechaLimite;
    });

  const frecuenciaVencidaSet = new Set(
    clientesVencidos.map((c) => c.id).filter((id): id is string => typeof id === 'string')
  );

  const sinVisitaSemanaSet = new Set(
    clientesSinVisitaReciente.map((c) => c.id).filter((id): id is string => typeof id === 'string')
  );

  const urgenciaSets = {
    frecuenciaVencida: frecuenciaVencidaSet,
    sinVisitaSemana: sinVisitaSemanaSet,
  };

  const visitasFiltradas = clienteIdFromUrl
    ? visitas.filter((v) => v.clienteId === clienteIdFromUrl)
    : visitas;

  const hoy = new Date();

  const visitasPendientes = visitasFiltradas
    .filter((v) => v.estado === 'pendiente')
    .sort((a, b) => {
      const urgenciaDiff =
        getUrgenciaScore(a.clienteId, urgenciaSets) - getUrgenciaScore(b.clienteId, urgenciaSets);

      if (urgenciaDiff !== 0) return urgenciaDiff;

      const atrasoA = getDiasAtraso(a.clienteId, ultimaVisitaMap, hoy);
      const atrasoB = getDiasAtraso(b.clienteId, ultimaVisitaMap, hoy);

      if (atrasoA !== atrasoB) return atrasoB - atrasoA;

      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });

  const visitasRealizadas = visitasFiltradas
    .filter((v) => v.estado === 'realizada')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const planDeHoy = visitasPendientes.slice(0, PLAN_DIARIO_LIMITE);

  const renderVisita = (visita: Visita) => {
    const esVisitaDeHoy = visita.fecha === hoyFecha;
    const urgenciaScore = getUrgenciaScore(visita.clienteId, urgenciaSets);
    const textoUrgencia = getTextoUrgencia(visita.clienteId, {
      frecuenciaVencida: urgenciaSets.frecuenciaVencida,
      sinVisitaSemana: urgenciaSets.sinVisitaSemana,
      ultimaVisitaMap,
      hoy,
    });

    return (
      <li
        key={visita.id}
        className={cn(
          'p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all border',
          urgenciaScore === 0 && 'border-l-4 border-l-red-500',
          urgenciaScore === 1 && 'border-l-4 border-l-orange-400',
          esVisitaDeHoy && urgenciaScore > 1 && 'border-l-4 border-l-green-500'
        )}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <div className="font-bold text-lg text-gray-900 flex items-center">
              {visita.cliente}
              {urgenciaScore === 0 && (
                <span className="ml-2 text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  URGENTE
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {visita.tipo} - {visita.fecha} {visita.hora}
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{visita.notas}</p>
            {textoUrgencia && <p className="text-xs text-red-600 font-medium mt-1">{textoUrgencia}</p>}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {visita.estado === 'pendiente' ? (
              <>
                <button
                  onClick={() => handleOpenMarcarRealizada(visita)}
                  title="Marcar como realizada"
                  className="flex items-center justify-center h-11 w-11 rounded-full text-green-600 hover:bg-green-100 transition-colors active:scale-95"
                >
                  <CheckCircle className="h-6 w-6" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button title="Eliminar visita" variant="ghost" size="icon" className="h-11 w-11 rounded-full text-red-500 hover:bg-red-100">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La visita pendiente para <strong>{visita.cliente}</strong> será eliminada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => visita.id && eliminarVisita(visita.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Realizada
              </Badge>
            )}
          </div>
        </div>

        {/* Mobile Actions */}
        {visita.estado === 'pendiente' && (
          <div className="md:hidden flex gap-2 w-full border-t mt-4 pt-3">
            <Button onClick={() => handleOpenMarcarRealizada(visita)} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" /> Marcar Realizada
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La visita pendiente para <strong>{visita.cliente}</strong> será eliminada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => visita.id && eliminarVisita(visita.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </li>
    );
  };

  const renderVisitaRealizada = (visita: Visita) => (
    <li key={visita.id} className="p-4 rounded-lg bg-white/70 shadow-sm border opacity-80">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="font-bold text-lg text-gray-800">{visita.cliente}</div>
          <div className="text-sm text-gray-500 capitalize">
            {visita.tipo} - {visita.fecha} {visita.hora}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{visita.notas}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Realizada
          </Badge>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button title="Eliminar visita" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-11 w-11 rounded-full hover:bg-red-100 active:scale-95">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La visita para{' '}
                  <strong>{visita.cliente}</strong> del día {visita.fecha} será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => visita.id && eliminarVisita(visita.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {/* Mobile Actions */}
      <div className="sm:hidden flex gap-2 w-full border-t mt-4 pt-3">
        <Badge variant="secondary" className="bg-green-100 text-green-800">Realizada</Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La visita para <strong>{visita.cliente}</strong> del día {visita.fecha} será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => visita.id && eliminarVisita(visita.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );

  return (
    <div className="p-6 pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {nombreClienteFiltrado ? `Agenda de ${nombreClienteFiltrado}` : 'Agenda'}
          </h1>
          {clienteIdFromUrl && <p className="text-sm text-gray-500 mt-1">Mostrando agenda del cliente seleccionado</p>}
        </div>

        <div className="hidden md:flex gap-2">
          <Button variant="outline" onClick={() => setOpenCrearCliente(true)}>
            + Nuevo Cliente
          </Button>
          <Button onClick={() => setOpenAgregarVisita(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Visita
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando agenda...</div>
      ) : (
        <div className="space-y-12">
          {/* Plan de Hoy */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
              Plan de Hoy ({hoyDiaSemana})
              <span className="text-lg font-normal text-gray-500">
                — {hoyFecha}
              </span>
            </h2>
            {planDeHoy.length > 0 ? (
              <ul className="space-y-4">{planDeHoy.map(renderVisita)}</ul>
            ) : (
              <p className="text-gray-500 italic">No hay visitas planeadas para hoy.</p>
            )}
          </section>

          {/* Próximas Visitas */}
          {visitasPendientes.length > 0 && (
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center py-2 border-b-2">
                  <h2 className="text-xl font-semibold">Próximas Visitas Pendientes</h2>
                  <ChevronDown className="h-6 w-6 transition-transform [&[data-state=open]]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-4 pt-4">
                  {visitasPendientes.map(renderVisita)}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Visitas Realizadas */}
          {visitasRealizadas.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center py-2 border-b-2">
                  <h2 className="text-xl font-semibold">Historial de Visitas Realizadas</h2>
                  <ChevronDown className="h-6 w-6 transition-transform [&[data-state=open]]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-4 pt-4">
                  {visitasRealizadas.map(renderVisitaRealizada)}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* --- Floating Action Buttons (Mobile) --- */}
      <div className="md:hidden fixed bottom-4 right-4 z-40 flex flex-col gap-3">
        <Button
          onClick={() => setOpenCrearCliente(true)}
          size="lg"
          className="rounded-full shadow-lg h-14 w-auto px-4"
        >
          + Cliente
        </Button>
        <Button
          onClick={() => setOpenAgregarVisita(true)}
          size="lg"
          className="rounded-full shadow-lg h-14 w-auto px-4 bg-red-600 hover:bg-red-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Visita
        </Button>
      </div>

      <CrearClienteModal open={openCrearCliente} onClose={() => setOpenCrearCliente(false)} />
      <AgregarVisitaModal
        open={openAgregarVisita}
        onClose={() => setOpenAgregarVisita(false)}
        onSave={handleSaveVisita}
        clientes={clientes}
        clienteIdInicial={clienteIdFromUrl}
      />
      
      {/* --- Modal para marcar visita como realizada --- */}
      <Dialog open={!!visitaParaMarcar} onOpenChange={() => setVisitaParaMarcar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Visita a {visitaParaMarcar?.cliente}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="nota-visita" className="block text-sm font-medium text-gray-700 mb-1">
              Agregar nota de la visita (opcional)
            </label>
            <Textarea
              id="nota-visita"
              value={notaVisita}
              onChange={(e) => setNotaVisita(e.target.value)}
              placeholder="Ej: Se entregó cotización, se acordó seguimiento..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitaParaMarcar(null)} disabled={guardandoRealizada}>Cancelar</Button>
            <Button onClick={handleConfirmarRealizada} disabled={guardandoRealizada} className="bg-green-600 hover:bg-green-700">
              {guardandoRealizada ? 'Guardando...' : 'Confirmar Visita Realizada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- Modal para buscar en DENUE --- */}
      <DenueSearchModal 
        open={denueSearchModalOpen}
        onClose={() => setDenueSearchModalOpen(false)}
        coords={denueSearchCoords}
      />
    </div>
  );
}


export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaView />
    </Suspense>
  );
}
