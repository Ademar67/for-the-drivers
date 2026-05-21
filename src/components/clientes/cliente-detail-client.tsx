'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FileText,
  Phone,
  MessageCircle,
  MapPin,
  CalendarDays,
  BadgeDollarSign,
  Clock,
  Pencil,
  Save,
  X,
  StickyNote,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import type { ClienteFS } from '@/lib/firestore/clientes';
import type { CotizacionFS } from '@/lib/firestore/cotizaciones';
import {
  listenTimelineCliente,
  agregarTimelineEvento,
  type TimelineEvento,
} from '@/lib/firestore/clientes';

function getSecondsSafe(value: unknown): number {
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds;
  }
  return 0;
}

function formatearFecha(ts: unknown): string {
  const secs = getSecondsSafe(ts);
  if (!secs) return '';
  return new Date(secs * 1000).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const TIPO_LABEL: Record<TimelineEvento['tipo'], string> = {
  nota: 'Nota',
  visita: 'Visita',
  seguimiento: 'Seguimiento',
  cotizacion: 'Cotizacion',
  whatsapp: 'WhatsApp',
  conversion: 'Conversion',
};

const TIPO_COLOR: Record<TimelineEvento['tipo'], string> = {
  nota: 'bg-slate-100 text-slate-700',
  visita: 'bg-green-100 text-green-700',
  seguimiento: 'bg-orange-100 text-orange-700',
  cotizacion: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  conversion: 'bg-purple-100 text-purple-700',
};

export default function ClienteDetailClient({ id }: { id: string }) {
  const [cliente, setCliente] = useState<ClienteFS | null>(null);
  const [cotizaciones, setCotizaciones] = useState<CotizacionFS[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [notaRapida, setNotaRapida] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    telefono: '',
    ciudad: '',
    domicilio: '',
    nota: '',
    diaVisita: '',
    semanaVisita: '',
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const docRef = doc(db, 'clientes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCliente({ id: docSnap.id, ...docSnap.data() } as ClienteFS);
        } else {
          setCliente(null);
        }
        const cotSnap = await getDocs(
          query(collection(db, 'cotizaciones'), where('clienteId', '==', id))
        );
        const cots = cotSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CotizacionFS))
          .sort((a, b) => {
            const aTime = getSecondsSafe((a as any).createdAt);
            const bTime = getSecondsSafe((b as any).createdAt);
            return bTime - aTime;
          });
        setCotizaciones(cots);
      } catch (error) {
        console.error('Error cargando detalle del cliente:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  useEffect(() => {
    const unsub = listenTimelineCliente(id, setTimeline);
    return () => unsub();
  }, [id]);

  const resumen = useMemo(() => {
    const totalCotizado = cotizaciones.reduce(
      (acc, cot) => acc + Number((cot as any).total ?? 0),
      0
    );
    return {
      totalCotizaciones: cotizaciones.length,
      totalCotizado,
      ticketPromedio:
        cotizaciones.length > 0 ? totalCotizado / cotizaciones.length : 0,
    };
  }, [cotizaciones]);

  const handleAgregarNota = async () => {
    if (!id || !notaRapida.trim()) return;
    try {
      setGuardandoNota(true);
      await agregarTimelineEvento(id, {
        tipo: 'nota',
        texto: notaRapida.trim(),
      });
      setNotaRapida('');
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar la nota.');
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleEditarAbrir = () => {
    setEditForm({
      nombre: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? '',
      ciudad: cliente?.ciudad ?? '',
      domicilio: cliente?.domicilio ?? '',
      nota: (cliente as any)?.nota ?? '',
      diaVisita: cliente?.diaVisita ?? '',
      semanaVisita: String(cliente?.semanaVisita ?? ''),
    });
    setEditando(true);
  };

  const handleGuardarEdicion = async () => {
    if (!id) return;
    try {
      setGuardando(true);
      await updateDoc(doc(db, 'clientes', id), {
        nombre: editForm.nombre.trim(),
        telefono: editForm.telefono.trim(),
        ciudad: editForm.ciudad.trim(),
        domicilio: editForm.domicilio.trim(),
        nota: editForm.nota.trim(),
        diaVisita: editForm.diaVisita || null,
        semanaVisita: editForm.semanaVisita ? Number(editForm.semanaVisita) : null,
        updatedAt: serverTimestamp(),
      });
      setCliente(prev => prev ? {
        ...prev,
        nombre: editForm.nombre.trim(),
        telefono: editForm.telefono.trim(),
        ciudad: editForm.ciudad.trim(),
        domicilio: editForm.domicilio.trim(),
        diaVisita: editForm.diaVisita || null,
        semanaVisita: editForm.semanaVisita ? Number(editForm.semanaVisita) : null,
      } : prev);
      setEditando(false);
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!cliente) return <div className="p-6">Cliente no encontrado.</div>;

  return (
    <div className="space-y-6">
      {/* Header azul */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-sm">
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize">
              {cliente.tipo ?? 'cliente'}
            </span>
            <button onClick={handleEditarAbrir} className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30">
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          </div>
          <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {cliente.ciudad && <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{cliente.ciudad}</span>}
            {cliente.telefono ? (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{cliente.telefono}</span>
            ) : (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs">Sin teléfono</span>
            )}
            {cliente.diaVisita && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs capitalize">
                {cliente.diaVisita} · Semana {cliente.semanaVisita}
              </span>
            )}
          </div>
          {cliente.domicilio && (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {cliente.domicilio}
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a href={`tel:${cliente.telefono ?? ''}`} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-700 py-4 text-sm font-semibold text-white transition hover:bg-slate-800">
          <Phone className="h-5 w-5" />Llamar
        </a>
        <a href={`https://wa.me/52${String(cliente.telefono ?? '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-sm font-semibold text-white transition hover:bg-green-600">
          <MessageCircle className="h-5 w-5" />WhatsApp
        </a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.domicilio ?? cliente.nombre ?? '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4 text-sm font-semibold text-white transition hover:bg-blue-600">
          <MapPin className="h-5 w-5" />Maps
        </a>
        <Link href={`/cotizaciones/nueva?clienteId=${id}`} className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 text-sm font-semibold text-white transition hover:bg-red-600">
          <FileText className="h-5 w-5" />Cotizar
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Cotizaciones</p>
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{resumen.totalCotizaciones}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total cotizado</p>
            <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold">${resumen.totalCotizado.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Ticket promedio</p>
            <CalendarDays className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-3xl font-bold">${resumen.ticketPromedio.toFixed(2)}</p>
        </div>
      </div>

      {/* Últimas cotizaciones */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Últimas cotizaciones</h2>
          <Link href={`/cotizaciones/nueva?clienteId=${id}`} className="text-sm text-blue-600 hover:underline">Nueva</Link>
        </div>
        {cotizaciones.length === 0 ? (
          <p className="text-sm text-slate-500">Sin cotizaciones todavía.</p>
        ) : (
          <div className="space-y-3">
            {cotizaciones.slice(0, 5).map((cot) => (
              <div key={cot.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Folio: {cot.id?.slice(-6)}</p>
                  <p className="text-xs text-slate-500">{formatearFecha((cot as any).createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-green-600">${Number((cot as any).total ?? 0).toFixed(2)}</p>
                  <button onClick={() => window.open(`/api/cotizaciones/pdf?id=${cot.id}`, '_blank')} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">PDF</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota rapida */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold">Agregar nota</h2>
        </div>
        <textarea
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          rows={3}
          placeholder="Escribe lo que dijo el cliente, acuerdos, detalles importantes..."
          value={notaRapida}
          onChange={e => setNotaRapida(e.target.value)}
        />
        <button
          onClick={handleAgregarNota}
          disabled={guardandoNota || !notaRapida.trim()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {guardandoNota ? 'Guardando...' : 'Guardar nota'}
        </button>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
          <Clock className="h-5 w-5" />Timeline
        </h2>
        <p className="mb-4 text-sm text-slate-500">Actividad y seguimiento del cliente.</p>
        {timeline.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-slate-500">Sin actividad todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((evento) => (
              <div key={evento.id} className="flex items-start gap-3 rounded-xl border bg-slate-50 px-4 py-3">
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLOR[evento.tipo] ?? 'bg-slate-100 text-slate-700'}`}>
                  {TIPO_LABEL[evento.tipo] ?? evento.tipo}
                </span>
                <p className="flex-1 text-sm text-slate-700">{evento.texto}</p>
                <p className="shrink-0 text-xs text-slate-400">{formatearFecha(evento.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Editar cliente</h2>
              <button onClick={() => setEditando(false)} className="rounded-xl p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Nombre</label>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Teléfono</label>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Ciudad</label>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.ciudad} onChange={e => setEditForm(f => ({ ...f, ciudad: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Domicilio</label>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.domicilio} onChange={e => setEditForm(f => ({ ...f, domicilio: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Día de visita</label>
                <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.diaVisita} onChange={e => setEditForm(f => ({ ...f, diaVisita: e.target.value }))}>
                  <option value="">Sin día</option>
                  <option value="lunes">Lunes</option>
                  <option value="martes">Martes</option>
                  <option value="miercoles">Miércoles</option>
                  <option value="jueves">Jueves</option>
                  <option value="viernes">Viernes</option>
                  <option value="sabado">Sábado</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Semana de visita</label>
                <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" value={editForm.semanaVisita} onChange={e => setEditForm(f => ({ ...f, semanaVisita: e.target.value }))}>
                  <option value="">Sin semana</option>
                  <option value="1">Semana 1</option>
                  <option value="2">Semana 2</option>
                  <option value="3">Semana 3</option>
                  <option value="4">Semana 4</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Notas</label>
                <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" rows={3} value={editForm.nota} onChange={e => setEditForm(f => ({ ...f, nota: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditando(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleGuardarEdicion} disabled={guardando} className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}