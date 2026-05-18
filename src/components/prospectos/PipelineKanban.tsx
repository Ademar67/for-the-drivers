'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ClienteFS } from '@/lib/firestore/clientes';
import { cn } from '@/lib/utils';

type EstadoProspecto = 'nuevo' | 'visitado' | 'seguimiento' | 'interesado' | 'no_interesado';

type ProspectoEnriquecido = ClienteFS & {
  ultimaVisitaReal?: Date;
  proximaVisitaReal?: Date;
  salud: { estado: string; texto: string };
  esParaHoy: boolean;
  esVencido: boolean;
};

const COLUMNAS: {
  key: EstadoProspecto;
  label: string;
  color: string;
  border: string;
  header: string;
}[] = [
  { key: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200', header: 'text-blue-700' },
  { key: 'visitado', label: 'Visitado', color: 'bg-green-100 text-green-700', border: 'border-green-200', header: 'text-green-700' },
  { key: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200', header: 'text-orange-700' },
  { key: 'interesado', label: 'Interesado', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', header: 'text-emerald-700' },
  { key: 'no_interesado', label: 'No interesado', color: 'bg-gray-100 text-gray-600', border: 'border-gray-200', header: 'text-gray-600' },
];

function formatearFecha(fecha?: Date) {
  if (!fecha) return null;
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function CardProspecto({ prospecto, isDragging = false }: { prospecto: ProspectoEnriquecido; isDragging?: boolean }) {
  return (
    <div className={cn('rounded-2xl border bg-white p-4 shadow-sm transition', isDragging ? 'opacity-50 rotate-1 shadow-lg' : 'hover:shadow-md hover:-translate-y-0.5')}>
      <p className="text-sm font-semibold text-slate-800">{prospecto.nombre}</p>
      <p className="mt-0.5 text-xs text-slate-500">{prospecto.ciudad}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {prospecto.esParaHoy && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Hoy</span>}
        {prospecto.esVencido && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Vencido</span>}
        <span className={cn('rounded-full px-2 py-0.5 text-xs', prospecto.salud.estado === 'activo' ? 'bg-green-100 text-green-700' : prospecto.salud.estado === 'riesgo' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>{prospecto.salud.estado}</span>
      </div>
      {prospecto.proximaVisitaReal && <p className="mt-2 text-xs text-slate-400">Próxima: {formatearFecha(prospecto.proximaVisitaReal)}</p>}
    </div>
  );
}

function SortableCard({ prospecto }: { prospecto: ProspectoEnriquecido }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prospecto.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <Link href={`/prospectos/${prospecto.id}`} onClick={(e) => { if (isDragging) e.preventDefault(); }}>
          <CardProspecto prospecto={prospecto} isDragging={isDragging} />
        </Link>
      </div>
    </div>
  );
}

export default function PipelineKanban({ prospectos }: { prospectos: ProspectoEnriquecido[] }) {
  const [items, setItems] = useState(prospectos);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeProspecto = activeId ? items.find((p) => p.id === activeId) : null;

  const getColumna = (id: string): EstadoProspecto => {
    const p = items.find((p) => p.id === id);
    return (p?.estadoProspecto ?? 'nuevo') as EstadoProspecto;
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columnaDestino = COLUMNAS.find((c) => c.key === overId);
    const estadoActual = getColumna(activeId);
    const nuevoEstado: EstadoProspecto = columnaDestino ? columnaDestino.key : getColumna(overId);
    if (nuevoEstado === estadoActual) return;
    setItems((prev) => prev.map((p) => p.id === activeId ? { ...p, estadoProspecto: nuevoEstado } : p));
    try {
      setGuardando(activeId);
      await updateDoc(doc(db, 'clientes', activeId), { estadoProspecto: nuevoEstado });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setItems((prev) => prev.map((p) => p.id === activeId ? { ...p, estadoProspecto: estadoActual } : p));
    } finally {
      setGuardando(null);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {COLUMNAS.map((col) => {
            const colItems = items.filter((p) => (p.estadoProspecto ?? 'nuevo') === col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className={cn('mb-3 flex items-center justify-between rounded-xl border px-3 py-2', col.border)}>
                  <span className={cn('text-sm font-semibold', col.header)}>{col.label}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', col.color)}>{colItems.length}</span>
                </div>
                <SortableContext id={col.key} items={colItems.map((p) => p.id!)} strategy={verticalListSortingStrategy}>
                  <div className="min-h-32 space-y-3 rounded-2xl p-1">
                    {colItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-white p-4 text-center text-sm text-slate-400">Sin prospectos</div>
                    ) : (
                      colItems.map((p) => (
                        <div key={p.id} className="relative">
                          {guardando === p.id && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80">
                              <span className="text-xs text-slate-500">Guardando...</span>
                            </div>
                          )}
                          <SortableCard prospecto={p} />
                        </div>
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeProspecto && <div className="rotate-2 shadow-xl"><CardProspecto prospecto={activeProspecto} /></div>}
      </DragOverlay>
    </DndContext>
  );
}
