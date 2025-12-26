
'use client';

import { useEffect, useState } from 'react';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import { db } from '@/lib/firebase';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = listenClientes(setClientes);
    return () => unsub();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Agregar cliente
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Nombre</th>
            <th>Tipo</th>
            <th>Ciudad</th>
            <th className="px-4 py-3 text-left">Día visita</th>
            <th className="px-4 py-3 text-left">Frecuencia</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.nombre}</td>
              <td>{c.tipo}</td>
              <td>{c.ciudad}</td>
              <td className="px-4 py-3">{c.diaVisita ?? '—'}</td>
              <td className="px-4 py-3">{c.frecuencia ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
