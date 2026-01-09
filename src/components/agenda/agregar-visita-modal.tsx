
'use client';

import { useState, useEffect } from 'react';
import type { ClienteFS } from '@/lib/firestore/clientes';

type NuevaVisita = {
  clienteId: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  notas: string;
};

export default function AgregarVisitaModal({
  open,
  onClose,
  onSave,
  clientes,
  clienteIdInicial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (visita: NuevaVisita) => void;
  clientes: ClienteFS[];
  clienteIdInicial?: string | null;
}) {
  const [form, setForm] = useState<NuevaVisita>({
    clienteId: clienteIdInicial || '',
    fecha: '',
    hora: '',
    tipo: 'visita',
    notas: '',
  });
  
  useEffect(() => {
    if (open) {
      setForm(prevForm => ({
        ...prevForm,
        clienteId: clienteIdInicial || '',
      }));
    }
  }, [open, clienteIdInicial]);


  if (!open) return null;

  const handleSave = () => {
    if (!form.clienteId) {
      alert('Por favor, selecciona un cliente.');
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#00468E]">
          Agregar visita
        </h2>

        <select
          className="w-full border rounded px-3 py-2"
          value={form.clienteId}
          onChange={(e) =>
            setForm({ ...form, clienteId: e.target.value })
          }
        >
          <option value="" disabled>Selecciona un cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={form.fecha}
          onChange={(e) =>
            setForm({ ...form, fecha: e.target.value })
          }
        />

        <input
          type="time"
          className="w-full border rounded px-3 py-2"
          value={form.hora}
          onChange={(e) =>
            setForm({ ...form, hora: e.target.value })
          }
        />

        <select
          className="w-full border rounded px-3 py-2"
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo: e.target.value as NuevaVisita['tipo'],
            })
          }
        >
          <option value="visita">Visita</option>
          <option value="cotizacion">Cotización</option>
          <option value="cobranza">Cobranza</option>
          <option value="seguimiento">Seguimiento</option>
        </select>

        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Notas"
          rows={3}
          value={form.notas}
          onChange={(e) =>
            setForm({ ...form, notas: e.target.value })
          }
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#DA251D] text-white rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
