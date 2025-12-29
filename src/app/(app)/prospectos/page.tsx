
'use client';

import { useEffect, useState } from 'react';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';


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

  useEffect(() => {
    const unsub = listenClientes((clientes) => {
        setProspectos(clientes.filter(c => c.tipo === 'prospecto'));
        setLoading(false);
    });

    async function loadVisitas() {
        const visitasFromDb = await obtenerVisitas();
        setVisitas(visitasFromDb);
    }
    
    loadVisitas();

    return () => unsub();
  }, []);
  
  const ultimaVisitaMap = new Map<string, Date>();
  visitas.forEach(v => {
      const fechaVisita = new Date(v.fecha);
      const fechaExistente = ultimaVisitaMap.get(v.clienteId);
      if (!fechaExistente || fechaVisita > fechaExistente) {
        ultimaVisitaMap.set(v.clienteId, fechaVisita);
      }
  });


  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Prospectos</h1>
         <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Agregar Prospecto
        </button>
      </div>
        
      {loading ? (
         <p className="text-gray-500 italic">Cargando prospectos...</p>
      ): prospectos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prospectos.map((prospecto) => {
                const salud = getSaludProspecto({
                    fechaCreacion: prospecto.createdAt.toDate(),
                    ultimaVisita: ultimaVisitaMap.get(prospecto.id!),
                    hoy: new Date(),
                });

                return (
                    <div key={prospecto.id} className="p-4 rounded-lg border bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">{prospecto.nombre}</h3>
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
                         <div className="mt-4 flex justify-end">
                             <Link
                                href={`/agenda?clienteId=${prospecto.id}`}
                                className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                            >
                                <Calendar className="h-4 w-4" />
                                Ver Agenda
                            </Link>
                        </div>
                    </div>
                )
            })}
        </div>
      ) : (
         <p className="text-gray-500 italic">No hay prospectos.</p>
      )}
      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

