
'use client';

import { useState } from 'react';
import { crearCliente } from '@/lib/firestore/clientes';

export default function CrearClienteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'prospecto',
    ciudad: '',
    domicilio: '',
    diaVisita: 'lunes',
    frecuencia: 'semanal',
  });

  if (!open) return null;

  async function guardar() {
    try {
      setLoading(true);
      await crearCliente({
        nombre: form.nombre,
        tipo: form.tipo as any,
        ciudad: form.ciudad,
        domicilio: form.domicilio,
        diaVisita: form.diaVisita,
        frecuencia: form.frecuencia,
      });
      onClose();
      setForm({
        nombre: '',
        tipo: 'prospecto',
        ciudad: '',
        domicilio: '',
        diaVisita: 'lunes',
        frecuencia: 'semanal',
      });
    } catch (e) {
      alert('Error guardando cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[420px] space-y-3">
        <h2 className="text-lg font-semibold">Agregar cliente</h2>

        <input
          placeholder="Nombre"
          className="w-full border p-2 rounded"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <input
          placeholder="Ciudad"
          className="w-full border p-2 rounded"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
        />

        <input
          placeholder="Domicilio"
          className="w-full border p-2 rounded"
          value={form.domicilio}
          onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
        />

        <select
          className="w-full border p-2 rounded"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        >
          <option value="cliente">Cliente</option>
          <option value="prospecto">Prospecto</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.diaVisita}
          onChange={(e) => setForm({ ...form, diaVisita: e.target.value })}
        >
          <option>lunes</option>
          <option>martes</option>
          <option>miercoles</option>
          <option>jueves</option>
          <option>viernes</option>
          <option>sabado</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.frecuencia}
          onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
        >
          <option>semanal</option>
          <option>quincenal</option>
          <option>mensual</option>
        </select>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={guardar}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
