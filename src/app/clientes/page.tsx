'use client';

import { useEffect, useState } from 'react';
import { getClientes, type Cliente } from '@/lib/firestore/clientes';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8">Cargando clientes…</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Clientes</h1>

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

        {clientes.length === 0 && (
          <div className="p-4 text-muted-foreground">
            No hay clientes en Firestore
          </div>
        )}
      </div>
    </div>
  );
}
