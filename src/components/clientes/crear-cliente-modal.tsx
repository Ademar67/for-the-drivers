'use client';

import { useState } from 'react';
import { crearCliente } from '@/lib/firestore/clientes';

export default function CrearClienteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [tipo, setTipo] = useState<'Cliente' | 'Prospecto' | 'Inactivo'>('Prospecto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit() {
    try {
      setLoading(true);
      setError('');
      await crearCliente({ nombre, ciudad, tipo });
      onClose();
      onCreated();
      setNombre('');
      setCiudad('');
      setTipo('Prospecto');
    } catch (e: any) {
      setError(e.message ?? 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-bold">Agregar cliente</h2>

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />

        <select
          className="w-full border rounded px-3 py-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as any)}
        >
          <option value="Cliente">Cliente</option>
          <option value="Prospecto">Prospecto</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#00468E] text-white rounded"
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
