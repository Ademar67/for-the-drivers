'use client';

import { useState } from 'react';

type NuevaVisita = {
  cliente: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  notas: string;
};

export default function AgregarVisitaModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (visita: NuevaVisita) => void;
}) {
  const [form, setForm] = useState<NuevaVisita>({
    cliente: '',
    fecha: '',
    hora: '',
    tipo: 'visita',
    notas: '',
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#00468E]">
          Agregar visita
        </h2>

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Cliente"
          value={form.cliente}
          onChange={(e) =>
            setForm({ ...form, cliente: e.target.value })
          }
        />

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
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="px-4 py-2 bg-[#DA251D] text-white rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
