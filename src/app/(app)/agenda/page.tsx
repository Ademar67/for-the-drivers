
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { crearVisita, listenVisitas, Visita, eliminarVisita, marcarVisitaRealizada } from '@/lib/firestore/visitas';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, PlusCircle, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import AgregarVisitaModal from '@/components/agenda/agregar-visita-modal';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
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


const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const hoyIndex = new Date().getDay(); // 0 = Domingo, 1 = Lunes
const hoyDiaSemana =
  hoyIndex === 0 ? 'domingo' : DIAS_SEMANA[hoyIndex - 1];
const hoyFecha = new Date().toISOString().split('T')[0];
const PLAN_DIARIO_LIMITE = 6;


function getUrgenciaScore(
  clienteId: string,
  sets: {
    frecuenciaVencida: Set<string>
    sinVisitaSemana: Set<string>
  }
) {
  if (sets.frecuenciaVencida.has(clienteId)) return 0
  if (sets.sinVisitaSemana.has(clienteId)) return 1
  return 2
}

function getTextoUrgencia(
  clienteId: string,
  data: {
    frecuenciaVencida: Set<string>
    sinVisitaSemana: Set<string>
    ultimaVisitaMap: Map<string, Date>
    hoy: Date
  }
) {
  if (data.frecuenciaVencida.has(clienteId)) {
    const ultimaVisita = data.ultimaVisitaMap.get(clienteId)

    if (!ultimaVisita) {
      return 'Nunca visitado'
    }

    const diffMs = data.hoy.getTime() - ultimaVisita.getTime()
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return `Frecuencia vencida — hace ${dias} días`
  }

  if (data.sinVisitaSemana.has(clienteId)) {
    return 'Sin visita esta semana'
  }

  return null
}

function getDiasAtraso(
    clienteId: string,
    ultimaVisitaMap: Map<string, Date>,
    hoy: Date
  ) {
    const ultimaVisita = ultimaVisitaMap.get(clienteId)
    if (!ultimaVisita) return Infinity // nunca visitado = máximo atraso
  
    const diffMs = hoy.getTime() - ultimaVisita.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
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
      const clienteSeleccionado = clientes.find(c => c.id === nuevaVisita.clienteId);
      if (!clienteSeleccionado) {
        throw new Error("Cliente no encontrado");
      }
      
      const visitaToSave = {
        ...nuevaVisita,
        cliente: clienteSeleccionado.nombre, 
        estado: 'pendiente' as const,
      };
      
      await crearVisita(visitaToSave);
      // La lista se actualiza sola gracias al listener
    } catch (error) {
      console.error('ERROR AL GUARDAR VISITA:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Error desconocido al guardar visita'
      );
    }
  };

  const handleOpenMarcarRealizada = (visita: Visita) => {
    setVisitaParaMarcar(visita);
    setNotaVisita(visita.notas || ''); // Pre-fill with existing notes
  };

  const handleConfirmarRealizada = async () => {
    if (!visitaParaMarcar) return;
    
    await marcarVisitaRealizada(visitaParaMarcar.id, notaVisita);

    // Reset and close modal
    setVisitaParaMarcar(null);
    setNotaVisita('');
  };
  
  const nombreClienteFiltrado = clienteIdFromUrl
    ? clientes.find(c => c.id === clienteIdFromUrl)?.nombre
    : null;
    
  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

  const clientesActivos = clientes.filter(c => c.tipo === 'cliente');

  const ultimaVisitaMap = new Map<string, Date>();
  visitas
    .filter(v => v.estado === 'realizada')
    .forEach(v => {
      const fechaVisita = new Date(v.fecha);
      const fechaExistente = ultimaVisitaMap.get(v.clienteId);
      if (!fechaExistente || fechaVisita > fechaExistente) {
        ultimaVisitaMap.set(v.clienteId, fechaVisita);
      }
    });

  
  const clientesSinVisitaReciente = clientesActivos.filter(cliente => {
    const visitasDelCliente = visitas.filter(v => v.clienteId === cliente.id);
    if (visitasDelCliente.length === 0) {
      return true;
    }
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
        return new Date(); // No vence nunca si no hay frecuencia
    }
    return fechaLimite;
  };
  
  const clientesVencidos = clientesActivos
    .filter(c => c.frecuencia) // Solo clientes con frecuencia definida
    .filter(cliente => {
      const visitasRealizadas = visitas.filter(
        v => v.clienteId === cliente.id && v.estado === 'realizada'
      );
  
      if (visitasRealizadas.length === 0) {
        return true; // Vencido si nunca se ha visitado
      }
  
      const ultimaVisita = visitasRealizadas.reduce((masReciente, actual) =>
        new Date(actual.fecha) > new Date(masReciente.fecha) ? actual : masReciente
      );
  
      const fechaLimite = getFechaLimite(new Date(ultimaVisita.fecha), cliente.frecuencia!);
      return new Date() > fechaLimite; // Vencido si hoy es después de la fecha límite
  });

  const frecuenciaVencidaSet = new Set(clientesVencidos.map(c => c.id).filter((id): id is string => typeof id === 'string'));
  const sinVisitaSemanaSet = new Set(clientesSinVisitaReciente.map(c => c.id).filter((id): id is string => typeof id === 'string'));

  const urgenciaSets = {
    frecuenciaVencida: frecuenciaVencidaSet,
    sinVisitaSemana: sinVisitaSemanaSet,
  };

  const visitasFiltradas = clienteIdFromUrl
    ? visitas.filter(v => v.clienteId === clienteIdFromUrl)
    : visitas;
  
  const hoy = new Date();
  
  const visitasPendientes = visitasFiltradas
    .filter(v => v.estado === 'pendiente')
    .sort((a, b) => {
        const urgenciaDiff =
          getUrgenciaScore(a.clienteId, urgenciaSets) -
          getUrgenciaScore(b.clienteId, urgenciaSets);
      
        if (urgenciaDiff !== 0) return urgenciaDiff;
      
        const atrasoA = getDiasAtraso(a.clienteId, ultimaVisitaMap, hoy);
        const atrasoB = getDiasAtraso(b.clienteId, ultimaVisitaMap, hoy);
      
        if (atrasoA !== atrasoB) return atrasoB - atrasoA;
      
        // Si tienen la misma urgencia y atraso, ordenar por fecha más próxima
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      });

  const visitasRealizadas = visitasFiltradas
    .filter(v => v.estado === 'realizada')
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-bold text-gray-900 flex items-center">
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
            <p className="text-sm text-gray-500 mt-1">{visita.notas}</p>
            {textoUrgencia && (
              <p className="text-xs text-red-600 font-medium mt-1">{textoUrgencia}</p>
            )}
          </div>
           <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                {visita.estado}
              </span>
               <button 
                 onClick={() => handleOpenMarcarRealizada(visita)}
                 title="Marcar como realizada"
                 className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors"
               >
                <CheckCircle className="h-5 w-5" />
               </button>
           </div>
        </div>
      </li>
    );
  };

  return (
    <div className="p-6">
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
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenCrearCliente(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + Nuevo Cliente
          </button>
          <button
            onClick={() => setOpenAgregarVisita(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <PlusCircle className="inline-block mr-2 h-5 w-5" />
            Agregar visita
          </button>
        </div>
      </div>
      
      {planDeHoy.length > 0 && !clienteIdFromUrl && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📋 Plan sugerido para hoy ({planDeHoy.length})
          </h2>
          <ul className="space-y-3">
            {planDeHoy.map(renderVisita)}
          </ul>
        </section>
      )}


      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 border-t pt-6">
            Visitas Pendientes ({visitasPendientes.length})
          </h2>
          {loading ? (
             <p className="text-gray-500 italic">Cargando visitas...</p>
          ) : visitasPendientes.length > 0 ? (
            <ul className="space-y-3">
              {visitasPendientes.map(renderVisita)}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay visitas pendientes {nombreClienteFiltrado ? `para ${nombreClienteFiltrado}` : ''}.</p>
          )}
        </div>
        
        <div>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 border-t pt-6">
              Visitas Realizadas ({visitasRealizadas.length})
            </h2>
            {loading ? (
              <p className="text-gray-500 italic">Cargando visitas...</p>
            ) : visitasRealizadas.length > 0 ? (
              <ul className="space-y-3">
                {visitasRealizadas.map((visita) => (
                  <li key={visita.id} className="p-4 rounded-lg bg-white/70 shadow-sm border opacity-80">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">{visita.cliente}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {visita.tipo} - {visita.fecha} {visita.hora}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{visita.notas}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Realizada
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
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
                                onClick={() => eliminarVisita(visita.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No hay visitas realizadas {nombreClienteFiltrado ? `para ${nombreClienteFiltrado}` : ''}.</p>
            )}
        </div>


        {clientesSinVisitaReciente.length > 0 && !clienteIdFromUrl && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-3 text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes sin visita esta semana ({clientesSinVisitaReciente.length})
            </h2>
            <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
              <ul className="space-y-2">
                {clientesSinVisitaReciente.map(cliente => (
                  <li key={cliente.id}>
                    <Link href={`/agenda?clienteId=${cliente.id}`} className="text-sm text-blue-600 hover:underline">
                      {cliente.nombre}
                    </Link>
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
                  {clientesVencidos.map(cliente => (
                    <li key={cliente.id} className="flex justify-between items-center">
                      <Link href={`/agenda?clienteId=${cliente.id}`} className="text-sm text-blue-600 hover:underline">
                        {cliente.nombre}
                      </Link>
                      <Badge variant="destructive">URGENTE</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}


        {!clienteIdFromUrl && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-t pt-6">Clientes a Visitar por Día</h2>
              <div className="space-y-6">
                {DIAS_SEMANA.map((dia) => {
                  const delDiaOriginal = clientes.filter(
                    (c) => c.diaVisita === dia && c.tipo !== 'inactivo' && c.diaVisita
                  );

                  if (delDiaOriginal.length === 0) {
                    return null;
                  }
                  
                  const delDia = [...delDiaOriginal].sort((a, b) => {
                    const urgenciaDiff =
                        getUrgenciaScore(a.id!, urgenciaSets) -
                        getUrgenciaScore(b.id!, urgenciaSets);

                    if (urgenciaDiff !== 0) return urgenciaDiff;

                    const atrasoA = getDiasAtraso(a.id!, ultimaVisitaMap, hoy);
                    const atrasoB = getDiasAtraso(b.id!, ultimaVisitaMap, hoy);

                    return atrasoB - atrasoA; // más atraso primero
                  });


                  const esHoy = dia === hoyDiaSemana;

                  return (
                    <Collapsible key={dia} defaultOpen={esHoy}>
                      <CollapsibleTrigger className="w-full">
                        <div
                          className={`
                            flex items-center justify-between p-3 rounded-lg border
                            ${
                              esHoy
                                ? 'bg-blue-100 border-blue-300'
                                : 'bg-gray-50 border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <h3
                              className={`text-lg font-semibold capitalize ${
                                esHoy ? 'text-blue-800' : 'text-gray-800'
                              }`}
                            >
                              {dia}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                esHoy
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {delDia.length}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-5 w-5 transition-transform data-[state=open]:rotate-180 ${
                              esHoy ? 'text-blue-700' : 'text-gray-600'
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 space-y-2 border-l-2 pl-6 ml-3">
                          {delDia.map((cliente) => {
                             const textoUrgencia = getTextoUrgencia(cliente.id!, {
                                frecuenciaVencida: urgenciaSets.frecuenciaVencida,
                                sinVisitaSemana: urgenciaSets.sinVisitaSemana,
                                ultimaVisitaMap,
                                hoy,
                             });
                             const urgenciaScore = getUrgenciaScore(cliente.id!, urgenciaSets);
                             return (
                             <li
                              key={cliente.id}
                              className={cn(
                                "p-3 rounded-md border text-sm hover:bg-gray-50 cursor-pointer bg-white relative",
                                urgenciaScore === 0 && "border-red-500",
                                urgenciaScore === 1 && "border-orange-400"
                              )}
                            >
                              {urgenciaScore === 0 && (
                                <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-full w-1.5 bg-red-500 rounded-r-full"></span>
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
                                {cliente.ciudad}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Frecuencia: {cliente.frecuencia}
                              </div>
                               {textoUrgencia && (
                                <p className="text-xs text-red-600 font-medium mt-1">{textoUrgencia}</p>
                              )}
                            </li>
                             )
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
      <Dialog open={!!visitaParaMarcar} onOpenChange={(isOpen) => !isOpen && setVisitaParaMarcar(null)}>
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
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setVisitaParaMarcar(null)}>Cancelar</Button>
                <Button onClick={handleConfirmarRealizada}>Guardar y Marcar como Realizada</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
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
