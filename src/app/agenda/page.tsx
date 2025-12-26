
'use client';

import { useEffect, useState } from 'react';

// We'll need a way to listen to agenda items.
// import { listenAgenda, type AgendaFS } from '@/lib/firestore/agenda';
// import CrearAgendaModal from '@/components/agenda/crear-agenda-modal';

export default function AgendaPage() {
  // const [agendaItems, setAgendaItems] = useState<AgendaFS[]>([]);
  const [open, setOpen] = useState(false);

  // useEffect(() => {
  //   const unsub = listenAgenda(setAgendaItems);
  //   return () => unsub();
  // }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agenda de Visitas</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nueva Tarea
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-center text-gray-500">
          Aquí se mostrarán las tareas de la agenda. ¡Próximamente!
        </p>
      </div>

      {/* <CrearAgendaModal open={open} onClose={() => setOpen(false)} /> */}
    </div>
  );
}
