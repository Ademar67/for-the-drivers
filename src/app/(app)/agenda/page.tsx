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

const hoyReal = new Date();
const hoyIndex = hoyReal.getDay(); // 0 = domingo
const hoyDiaSemana = hoyIndex === 0 ? 'domingo' : DIAS_SEMANA[hoyIndex - 1];
const hoyFecha = hoyReal.toISOString().split('T')[0];
const PLAN_DIARIO_LIMITE = 6;

function getWeekOfMonth(date: Date) {
  const day = date.getDate();
  const week = Math.ceil(day / 7);
  return Math.min(week, 4);
}

function getDateOnlyLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameMonthAndYear(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth()
  );
}

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
  }
) {
  if (data.frecuenciaVencida.has(clienteId)) {
    return 'Frecuencia vencida este mes';
  }

  if (data.sinVisitaSemana.has(clienteId)) {
    return 'Pendiente en su semana asignada';
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

  const [visitaParaMarcar, setVisitaParaMarcar] = useState<Visita | null>(null);
  const [notaVisita, setNotaVisita] = useState('');
  const [guardandoRealizada, setGuardandoRealizada] = useState(false);

  const [denueSearchModalOpen, setDenueSearchModalOpen] = useState(false);
  const [denueSearchCoords, setDenueSearchCoords] = useState<{ lat: number; lng: number } | null>(null);

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
    } catch (error) {
      console.error('ERROR AL GUARDAR VISITA:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido al guardar visita');
    }
  };

  const handleQuitarDeLista = async (clienteId: string, clienteNombre: string) => {
    try {
      await crearVisita({
        clienteId,
        cliente: clienteNombre,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'visita',
        notas: 'Visita rápida para quitar de pendientes.',
        estado: 'realizada',
      });
    } catch (error) {
      console.error('Error al quitar cliente de la lista:', error);
      alert('No se pudo quitar al cliente de la lista.');
    }
  };

  const handleOpenMarcarRealizada = (visita: Visita) => {
    setVisitaParaMarcar(visita);
    setNotaVisita(visita.notas || '');
  };

  const handleConfirmarRealizada = async () => {
    if (!visitaParaMarcar) return;

    const currentVisita = visitaParaMarcar;

    try {
      setGuardandoRealizada(true);
      if (!currentVisita?.id) {
        console.error('Visita sin id');
        setGuardandoRealizada(false);
        return;
      }
      await marcarVisitaRealizada(currentVisita.id, notaVisita ?? '');

      setVisitaParaMarcar(null);
      setNotaVisita('');

      const clienteDeVisita = clientes.find((c) => c.id === currentVisita.clienteId);

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

  const hoy = getDateOnlyLocal(new Date());
  const semanaActual = getWeekOfMonth(hoy);

  const clientesActivos = clientes.filter((c) => c.tipo === 'cliente');

  const ultimaVisitaMap = new Map<string, Date>();
  const visitaEsteMesMap = new Map<string, Date>();

  visitas
    .filter((v) => v.estado === 'realizada')
    .forEach((v) => {
      if (typeof v.fecha !== 'string') return;

      const fechaVisita = new Date(`${v.fecha}T00:00:00`);
      if (isNaN(fechaVisita.getTime())) return;

      const fechaExistente = ultimaVisitaMap.get(v.clienteId);
      if (!fechaExistente || fechaVisita > fechaExistente) {
        ultimaVisitaMap.set(v.clienteId, fechaVisita);
      }

      if (isSameMonthAndYear(fechaVisita, hoy)) {
        const fechaMesExistente = visitaEsteMesMap.get(v.clienteId);
        if (!fechaMesExistente || fechaVisita > fechaMesExistente) {
          visitaEsteMesMap.set(v.clienteId, fechaVisita);
        }
      }
    });

  const yaVisitadoEsteMes = (clienteId?: string) => {
    if (!clienteId) return false;
    return visitaEsteMesMap.has(clienteId);
  };

  const yaPasoSuTurnoEsteMes = (cliente: ClienteFS) => {
    if (!cliente.semanaVisita || !cliente.diaVisita) return false;

    const indexDiaCliente = DIAS_SEMANA.indexOf(cliente.diaVisita);
    const indexDiaHoy = DIAS_SEMANA.indexOf(hoyDiaSemana);

    if (indexDiaCliente === -1 || indexDiaHoy === -1) return false;

    if (semanaActual > cliente.semanaVisita) return true;
    if (semanaActual < cliente.semanaVisita) return false;

    return indexDiaHoy > indexDiaCliente;
  };

  const tocaHoyCliente = (cliente: ClienteFS) => {
    if (cliente.tipo !== 'cliente') return false;
    if (!cliente.semanaVisita || !cliente.diaVisita) return false;
    if (cliente.frecuencia !== 'mensual') return false;
    if (yaVisitadoEsteMes(cliente.id)) return false;

    return (
      cliente.semanaVisita === semanaActual &&
      cliente.diaVisita === hoyDiaSemana
    );
  };

  const clientesProgramadosHoy = clientesActivos.filter(tocaHoyCliente);

  const clientesVencidos = clientesActivos.filter((cliente) => {
    if (!cliente.id) return false;
    if (!cliente.semanaVisita || !cliente.diaVisita) return false;
    if (cliente.frecuencia !== 'mensual') return false;
    if (yaVisitadoEsteMes(cliente.id)) return false;

    return yaPasoSuTurnoEsteMes(cliente);
  });

  const clientesVencidosIdSet = new Set(clientesVencidos.map((c) => c.id));

  const clientesSinVisitaSemana = clientesActivos.filter((cliente) => {
    if (!cliente.id) return false;
    if (clientesVencidosIdSet.has(cliente.id)) return false;
    if (!cliente.semanaVisita || !cliente.diaVisita) return false;
    if (cliente.frecuencia !== 'mensual') return false;
    if (yaVisitadoEsteMes(cliente.id)) return false;

    return cliente.semanaVisita === semanaActual;
  });

  const frecuenciaVencidaSet = new Set(
    clientesVencidos.map((c) => c.id).filter((id): id is string => typeof id === 'string')
  );

  const sinVisitaSemanaSet = new Set(
    clientesSinVisitaSemana.map((c) => c.id).filter((id): id is string => typeof id === 'string')
  );

  const urgenciaSets = {
    frecuenciaVencida: frecuenciaVencidaSet,
    sinVisitaSemana: sinVisitaSemanaSet,
  };

  const visitasFiltradas = clienteIdFromUrl
    ? visitas.filter((v) => v.clienteId === clienteIdFromUrl)
    : visitas;

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

  const planDeHoyManual = visitasPendientes.slice(0, PLAN_DIARIO_LIMITE);

  const renderVisita = (visita: Visita) => {
    const esVisitaDeHoy = visita.fecha === hoyFecha;
    const urgenciaScore = getUrgenciaScore(visita.clienteId, urgenciaSets);
    const textoUrgencia = getTextoUrgencia(visita.clienteId, {
      frecuenciaVencida: urgenciaSets.frecuenciaVencida,
      sinVisitaSemana: urgenciaSets.sinVisitaSemana,
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
            {textoUrgencia && (
              <p className="text-xs text-red-600 font-medium mt-1">{textoUrgencia}</p>
            )}
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
                    <Button
                      title="Eliminar visita"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-full text-red-500 hover:bg-red-100"
                    >
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

        {visita.estado === 'pendiente' && (
          <div className="md:hidden flex gap-2 w-full border-t mt-4 pt-3">
            <Button
              onClick={() => handleOpenMarcarRealizada(visita)}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
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
              <Button
                title="Eliminar visita"
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 h-11 w-11 rounded-full hover:bg-red-100 active:scale-95"
              >
                <Trash2 className="h-5 w-5" />
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
      </div>

      <div className="sm:hidden flex gap-2 w-full border-t mt-4 pt-3">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Realizada
        </Badge>
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
          {clienteIdFromUrl && (
            <p className="text-sm text-gray-500 mt-1">
              Mostrando agenda del cliente seleccionado
            </p>
          )}
          {!clienteIdFromUrl && (
            <p className="text-sm text-gray-500 mt-1">
              Semana actual del mes: <strong>{semanaActual}</strong>
            </p>
          )}
        </div>

        <div className="hidden md:flex gap-2">
          <Button onClick={() => setOpenCrearCliente(true)}>+ Nuevo Cliente</Button>
          <Button onClick={() => setOpenAgregarVisita(true)} className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            Agregar visita
          </Button>
        </div>
      </div>

      {!clienteIdFromUrl && clientesProgramadosHoy.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📍 Clientes programados para hoy ({clientesProgramadosHoy.length})
          </h2>
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <ul className="space-y-2">
              {clientesProgramadosHoy.map((cliente) => (
                <li key={cliente.id} className="flex justify-between items-center gap-3">
                  <div>
                    <div className="font-medium">{cliente.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {cliente.ciudad} · {cliente.tipoZona ?? '—'} · Semana {cliente.semanaVisita}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agenda?clienteId=${cliente.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver agenda
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 h-8 w-8">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Marcar como visitado?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se registrará una visita rápida para <strong>{cliente.nombre}</strong> y dejará de aparecer este mes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleQuitarDeLista(cliente.id!, cliente.nombre)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Marcar visita
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {planDeHoyManual.length > 0 && !clienteIdFromUrl && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📋 Plan manual sugerido para hoy ({planDeHoyManual.length})
          </h2>
          <ul className="space-y-3">{planDeHoyManual.map(renderVisita)}</ul>
        </section>
      )}

      <div className="space-y-2">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="w-full py-2">
            <div className="flex items-center justify-between border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Visitas Pendientes ({visitasPendientes.length})
              </h2>
              <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3">
              {loading ? (
                <p className="text-gray-500 italic">Cargando visitas...</p>
              ) : visitasPendientes.length > 0 ? (
                <ul className="space-y-3">{visitasPendientes.map(renderVisita)}</ul>
              ) : (
                <p className="text-gray-500 italic">
                  No hay visitas pendientes {nombreClienteFiltrado ? `para ${nombreClienteFiltrado}` : ''}.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="w-full py-2">
            <div className="flex items-center justify-between border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Visitas Realizadas ({visitasRealizadas.length})
              </h2>
              <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3">
              {loading ? (
                <p className="text-gray-500 italic">Cargando visitas...</p>
              ) : visitasRealizadas.length > 0 ? (
                <ul className="space-y-3">{visitasRealizadas.map(renderVisitaRealizada)}</ul>
              ) : (
                <p className="text-gray-500 italic">
                  No hay visitas realizadas {nombreClienteFiltrado ? `para ${nombreClienteFiltrado}` : ''}.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {clientesSinVisitaSemana.length > 0 && !clienteIdFromUrl && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-3 text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes pendientes en su semana ({clientesSinVisitaSemana.length})
            </h2>

            <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
              <ul className="space-y-2">
                {clientesSinVisitaSemana.map((cliente) => (
                  <li key={cliente.id} className="flex justify-between items-center">
                    <div>
                      <Link
                        href={`/agenda?clienteId=${cliente.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {cliente.nombre}
                      </Link>
                      <p className="text-xs text-gray-600">
                        {cliente.diaVisita} · Semana {cliente.semanaVisita}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Quitar de la lista?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se registrará una visita rápida para quitar a <strong>{cliente.nombre}</strong> de las listas pendientes del mes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleQuitarDeLista(cliente.id!, cliente.nombre)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Quitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {clientesVencidos.length > 0 && !clienteIdFromUrl && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-3 text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes con frecuencia vencida ({clientesVencidos.length})
            </h2>

            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
              <ul className="space-y-2">
                {clientesVencidos.map((cliente) => (
                  <li key={cliente.id} className="flex justify-between items-center">
                    <div>
                      <Link
                        href={`/agenda?clienteId=${cliente.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {cliente.nombre}
                      </Link>
                      <Badge variant="destructive" className="ml-2">
                        URGENTE
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {cliente.diaVisita} · Semana {cliente.semanaVisita}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Quitar de la lista?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se registrará una visita rápida para quitar a <strong>{cliente.nombre}</strong> de las listas de pendientes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleQuitarDeLista(cliente.id!, cliente.nombre)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Quitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!clienteIdFromUrl && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-t pt-6">
              Clientes a Visitar por Día · Semana {semanaActual}
            </h2>

            <div className="space-y-6">
              {DIAS_SEMANA.map((dia) => {
              const delDiaOriginal = clientes.filter(
                (c) =>
                  c.tipo === 'cliente' &&
                  c.diaVisita === dia &&
                  c.semanaVisita === semanaActual &&
                  c.frecuencia === 'mensual' &&
                  !yaVisitadoEsteMes(c.id!)
              );

                if (delDiaOriginal.length === 0) return null;

                const delDia = [...delDiaOriginal].sort((a, b) => {
                  const urgenciaDiff =
                    getUrgenciaScore(a.id!, urgenciaSets) - getUrgenciaScore(b.id!, urgenciaSets);

                  if (urgenciaDiff !== 0) return urgenciaDiff;

                  const atrasoA = getDiasAtraso(a.id!, ultimaVisitaMap, hoy);
                  const atrasoB = getDiasAtraso(b.id!, ultimaVisitaMap, hoy);

                  return atrasoB - atrasoA;
                });

                const esHoy = dia === hoyDiaSemana;

                return (
                  <Collapsible key={dia} defaultOpen={esHoy}>
                    <CollapsibleTrigger className="w-full">
                      <div
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          esHoy ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <h3
                            className={cn(
                              'text-lg font-semibold capitalize',
                              esHoy ? 'text-blue-800' : 'text-gray-800'
                            )}
                          >
                            {dia}
                          </h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              esHoy ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                            )}
                          >
                            {delDia.length}
                          </span>
                        </div>

                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-transform data-[state=open]:rotate-180',
                            esHoy ? 'text-blue-700' : 'text-gray-600'
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <ul className="mt-2 space-y-2 border-l-2 pl-6 ml-3">
                        {delDia.map((cliente) => {
                          const textoUrgencia = getTextoUrgencia(cliente.id!, {
                            frecuenciaVencida: urgenciaSets.frecuenciaVencida,
                            sinVisitaSemana: urgenciaSets.sinVisitaSemana,
                          });

                          const urgenciaScore = getUrgenciaScore(cliente.id!, urgenciaSets);

                          return (
                            <li
                              key={cliente.id}
                              className={cn(
                                'p-3 rounded-md border text-sm hover:bg-gray-50 cursor-pointer bg-white relative',
                                urgenciaScore === 0 && 'border-red-500',
                                urgenciaScore === 1 && 'border-orange-400'
                              )}
                            >
                              {urgenciaScore === 0 && (
                                <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-full w-1.5 bg-red-500 rounded-r-full" />
                              )}

                              <div className="font-semibold flex justify-between items-center">
                                {cliente.nombre}
                                {urgenciaScore === 0 && (
                                  <span className="ml-2 text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                    URGENTE
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-gray-600">
                                {cliente.ciudad} · {cliente.tipoZona ?? '—'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Semana {cliente.semanaVisita} · Frecuencia: {cliente.frecuencia}
                              </div>

                              {textoUrgencia && (
                                <p className="text-xs text-red-600 font-medium mt-1">
                                  {textoUrgencia}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CrearClienteModal open={openCrearCliente} onClose={() => setOpenCrearCliente(false)} />

      <AgregarVisitaModal
        open={openAgregarVisita}
        onClose={() => setOpenAgregarVisita(false)}
        onSave={handleSaveVisita}
        clientes={clientes}
        clienteIdInicial={clienteIdFromUrl}
      />

      <Dialog
        open={!!visitaParaMarcar}
        onOpenChange={(isOpen) => !isOpen && setVisitaParaMarcar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar visita como realizada</DialogTitle>
            <DialogDescription>
              Agrega o actualiza la nota de la visita para <strong>{visitaParaMarcar?.cliente}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Escribe aquí las notas de la visita..."
              value={notaVisita}
              onChange={(e) => setNotaVisita(e.target.value)}
              rows={5}
              className="w-full"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setVisitaParaMarcar(null)}
              disabled={guardandoRealizada}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarRealizada}
              disabled={guardandoRealizada}
              className="w-full sm:w-auto"
            >
              {guardandoRealizada ? 'Guardando...' : 'Guardar y Marcar como Realizada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 md:hidden">
        <div className="flex gap-2">
          <Button onClick={() => setOpenCrearCliente(true)} variant="outline" className="h-12 flex-1 text-base">
            + Nuevo Cliente
          </Button>
          <Button onClick={() => setOpenAgregarVisita(true)} className="h-12 flex-1 text-base">
            <PlusCircle className="mr-2 h-5 w-5" />
            Agregar visita
          </Button>
        </div>
      </div>

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
    <Suspense fallback={<div>Cargando agenda...</div>}>
      <AgendaView />
    </Suspense>
  );
}