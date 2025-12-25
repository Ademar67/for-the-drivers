'use client';

import { useEffect, useState } from 'react';
import { getClientes, type Cliente } from '@/lib/firestore/clientes';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function cargar() {
    setLoading(true);
    const data = await getClientes();
    setClientes(data);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  if (loading) {
    return <div className="p-8">Cargando clientes…</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-[#00468E] text-white px-4 py-2 rounded"
        >
          + Agregar cliente
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.nombre}</td>
                <td className="px-4 py-3">{c.tipo}</td>
                <td className="px-4 py-3">{c.ciudad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CrearClienteModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={cargar}
      />
    </div>
  );
}
