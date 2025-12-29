
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { crearVisita, obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, PlusCircle, AlertTriangle } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import AgregarVisitaModal from '@/components/agenda/agregar-visita-modal';
import { Badge } from '@/components/ui/badge';


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


export default function AgendaPage() {
  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get('clienteId');
  
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCrearCliente, setOpenCrearCliente] = useState(false);
  const [openAgregarVisita, setOpenAgregarVisita] = useState(false);

  useEffect(() => {
    const unsub = listenClientes(setClientes);
    
    async function loadVisitas() {
      try {
        setLoading(true);
        const visitasFromDb = await obtenerVisitas();
        setVisitas(visitasFromDb);
      } catch (error) {
        console.error("Error al cargar las visitas:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVisitas();

    return () => unsub();
  }, []);

  const handleSaveVisita = async (nuevaVisita: {
    clienteId: string;
    fecha: string;
    hora: string;
    tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
    notas: string;
    lat?: number;
    lng?: number;
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
        lat: clienteSeleccionado.lat,
        lng: clienteSeleccionado.lng,
      };
      
      await crearVisita(visitaToSave);

      const visitasFromDb = await obtenerVisitas();
      setVisitas(visitasFromDb);

    } catch (error) {
      console.error("Error al crear la visita:", error);
      alert("No se pudo guardar la visita. Inténtalo de nuevo.");
    }
  };
  
  const nombreClienteFiltrado = clienteIdFromUrl
    ? clientes.find(c => c.id === clienteIdFromUrl)?.nombre
    : null;
    
  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

  const clientesActivos = clientes.filter(c => c.tipo === 'cliente');
  
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

  const frecuenciaVencidaSet = new Set(clientesVencidos.map(c => c.id));
  const sinVisitaSemanaSet = new Set(clientesSinVisitaReciente.map(c => c.id));

  const urgenciaSets = {
    frecuenciaVencida: frecuenciaVencidaSet,
    sinVisitaSemana: sinVisitaSemanaSet,
  };

  const visitasFiltradas = clienteIdFromUrl
    ? visitas.filter(v => v.clienteId === clienteIdFromUrl)
    : visitas;

  const visitasPendientes = visitasFiltradas
    .filter(v => v.estado === 'pendiente')
    .sort((a, b) => {
      const diff =
        getUrgenciaScore(a.clienteId, urgenciaSets) -
        getUrgenciaScore(b.clienteId, urgenciaSets);

      if (diff !== 0) return diff;

      // Si tienen la misma urgencia, ordenar por fecha más próxima
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {nombreClienteFiltrado ? `Agenda de ${nombreClienteFiltrado}` : 'Agenda'}
          </h1>
          {clienteIdFromUrl && (
            <p className="text-sm text-gray-500 mt-1">
              Mostrando solo las visitas para el cliente seleccionado.
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

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Visitas Pendientes</h2>
          {loading ? (
             <p className="text-gray-500 italic">Cargando visitas...</p>
          ) : visitasPendientes.length > 0 ? (
            <ul className="space-y-3">
              {visitasPendientes.map((visita) => {
                const esVisitaDeHoy = visita.fecha === hoyFecha;
                const estaVencido = frecuenciaVencidaSet.has(visita.clienteId);

                let borderColor = 'border'; // Default
                if (estaVencido) {
                    borderColor = 'border-l-4 border-l-red-500';
                } else if (esVisitaDeHoy) {
                    borderColor = 'border-l-4 border-l-green-500';
                }

                return (
                  <li
                    key={visita.id}
                    className={`
                      p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow
                      ${borderColor}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">{visita.cliente}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {visita.tipo} - {visita.fecha} {visita.hora}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{visita.notas}</p>
                      </div>
                       <div className="flex items-center gap-2">
                          {estaVencido && <Badge variant="destructive">URGENTE</Badge>}
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            {visita.estado}
                          </span>
                       </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay visitas pendientes {nombreClienteFiltrado ? `para ${nombreClienteFiltrado}` : ''}.</p>
          )}
        </div>

        {clientesSinVisitaReciente.length > 0 && !clienteIdFromUrl && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-3 text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Clientes sin visita esta semana ({clientesSinVisitaReciente.length})
            </h2>
            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
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
              <h2 className="text-xl font-semibold mb-3 text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Clientes con frecuencia vencida ({clientesVencidos.length})
              </h2>
              <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
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
                    return getUrgenciaScore(a.id, urgenciaSets) - getUrgenciaScore(b.id, urgenciaSets);
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
                          {delDia.map((cliente) => (
                             <li
                              key={cliente.id}
                              className="p-3 rounded-md border text-sm hover:bg-gray-50 cursor-pointer bg-white relative"
                            >
                              {frecuenciaVencidaSet.has(cliente.id) && (
                                <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-full w-1.5 bg-red-500 rounded-r-full"></span>
                              )}
                              <div className="font-semibold flex justify-between items-center">
                                {cliente.nombre}
                                {frecuenciaVencidaSet.has(cliente.id) && <Badge variant="destructive" className="text-xs">URGENTE</Badge>}
                              </div>
                              <div className="text-xs text-gray-600">
                                {cliente.ciudad}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Frecuencia: {cliente.frecuencia}
                              </div>
                            </li>
                          ))}
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
    </div>
  );
}
