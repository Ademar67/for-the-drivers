
'use client';

import { useEffect, useState } from 'react';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { crearVisita, obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, PlusCircle } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import AgregarVisitaModal from '@/components/agenda/agregar-visita-modal';
import { Timestamp } from 'firebase/firestore';


const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const hoyIndex = new Date().getDay(); // 0 = Domingo, 1 = Lunes
const hoy =
  hoyIndex === 0 ? 'domingo' : DIAS_SEMANA[hoyIndex - 1];

export default function AgendaPage() {
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
  }) => {
    try {
      const clienteSeleccionado = clientes.find(c => c.id === nuevaVisita.clienteId);
      if (!clienteSeleccionado) {
        throw new Error("Cliente no encontrado");
      }

      const visitaToSave = {
        ...nuevaVisita,
        cliente: clienteSeleccionado.nombre, // Guardamos el nombre para visualización
        estado: 'pendiente' as const,
      };
      
      await crearVisita(visitaToSave);

      // Recargamos las visitas para obtener la nueva con lat/lng
      const visitasFromDb = await obtenerVisitas();
      setVisitas(visitasFromDb);

    } catch (error) {
      console.error("Error al crear la visita:", error);
      alert("No se pudo guardar la visita. Inténtalo de nuevo.");
    }
  };

  const visitasPendientes = visitas.filter(v => v.estado === 'pendiente');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agenda</h1>
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
        {/* Sección de Visitas Pendientes */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Visitas Pendientes</h2>
          {loading ? (
             <p className="text-gray-500 italic">Cargando visitas...</p>
          ) : visitasPendientes.length > 0 ? (
            <ul className="space-y-3">
              {visitasPendientes.map((visita) => (
                <li
                  key={visita.id}
                  className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">{visita.cliente}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {visita.tipo} - {visita.fecha} {visita.hora}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{visita.notas}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {visita.estado}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay visitas pendientes.</p>
          )}
        </div>

        {/* Sección de Clientes por Día */}
        <div>
           <h2 className="text-xl font-semibold mb-4 text-gray-800 border-t pt-6">Clientes a Visitar por Día</h2>
            <div className="space-y-6">
              {DIAS_SEMANA.map((dia) => {
                const delDia = clientes.filter(
                  (c) => c.diaVisita === dia && c.tipo !== 'inactivo' && c.diaVisita
                );

                if (delDia.length === 0) {
                  return null;
                }

                const esHoy = dia === hoy;

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
                            className="p-3 rounded-md border text-sm hover:bg-gray-50 cursor-pointer bg-white"
                          >
                            <div className="font-semibold">{cliente.nombre}</div>
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
      </div>
      <CrearClienteModal open={openCrearCliente} onClose={() => setOpenCrearCliente(false)} />
      <AgregarVisitaModal 
        open={openAgregarVisita}
        onClose={() => setOpenAgregarVisita(false)}
        onSave={handleSaveVisita}
        clientes={clientes}
      />
    </div>
  );
}
