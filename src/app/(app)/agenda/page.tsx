
'use client';

import { useEffect, useState } from 'react';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';

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
  const [openCrear, setOpenCrear] = useState(false);

  useEffect(() => {
    const unsub = listenClientes(setClientes);
    return () => unsub();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agenda de Visitas</h1>
        <button
          onClick={() => setOpenCrear(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nuevo Cliente
        </button>
      </div>

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
                    className={`h-5 w-5 transition-transform ${
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
      <CrearClienteModal open={openCrear} onClose={() => setOpenCrear(false)} />
    </div>
  );
}
