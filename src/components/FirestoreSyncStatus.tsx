'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase'; // ajusta si tu path es distinto
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { useAuth } from '@/lib/useAuth'; // ajusta a tu hook/context real (ej: FirebaseClientProvider)

type SyncState = 'OFFLINE' | 'PENDING' | 'SYNCING' | 'UP_TO_DATE';

function Badge({ state, text }: { state: SyncState; text: string }) {
  const cls = useMemo(() => {
    switch (state) {
      case 'OFFLINE':
        return 'bg-zinc-900 text-zinc-100 border-zinc-700';
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'SYNCING':
        return 'bg-sky-500/15 text-sky-300 border-sky-400/30';
      case 'UP_TO_DATE':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      default:
        return 'bg-zinc-900 text-zinc-100 border-zinc-700';
    }
  }, [state]);

  return (
    <div className="fixed top-2 right-2 z-[9999]">
      <div className={`px-3 py-1 text-xs rounded-full border backdrop-blur ${cls}`}>
        {text}
      </div>
    </div>
  );
}

/**
 * Nivel 2:
 * - OFFLINE: sin internet
 * - PENDING: hay escrituras locales pendientes (hasPendingWrites)
 * - SYNCING: ya hay internet y se están subiendo
 * - UP_TO_DATE: todo confirmado (se muestra breve)
 */
export default function FirestoreSyncStatus() {
  const { user } = useAuth(); // debe tener user?.uid
  const [isOnline, setIsOnline] = useState(true);

  const [anyPendingWrites, setAnyPendingWrites] = useState(false);
  const [anyFromCache, setAnyFromCache] = useState(false);

  const [state, setState] = useState<SyncState>('UP_TO_DATE');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') setIsOnline(navigator.onLine);

    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);

    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // 👇 Ojo: ajusta nombres reales de tus colecciones si difieren
    // Se escuchan poquitos docs (limit 1) solo para metadata global.
    const unsubs: Unsubscribe[] = [];

    const trackers: Record<string, { pending: boolean; cache: boolean }> = {
      clientes: { pending: false, cache: false },
      cotizaciones: { pending: false, cache: false },
      materiales: { pending: false, cache: false },
    };

    function recompute() {
      const pending = Object.values(trackers).some((t) => t.pending);
      const cache = Object.values(trackers).some((t) => t.cache);
      setAnyPendingWrites(pending);
      setAnyFromCache(cache);
    }

    const clientesQ = query(
      collection(db, 'users', user.uid, 'customers'),
      limit(1)
    );

    const cotizacionesQ = query(
      collection(db, 'users', user.uid, 'quotes'),
      limit(1)
    );

    const materialesQ = query(
      collection(db, 'users', user.uid, 'materiales'),
      limit(1)
    );

    unsubs.push(
      onSnapshot(
        clientesQ,
        { includeMetadataChanges: true },
        (snap) => {
          trackers.clientes.pending = snap.metadata.hasPendingWrites;
          trackers.clientes.cache = snap.metadata.fromCache;
          recompute();
        }
      )
    );

    unsubs.push(
      onSnapshot(
        cotizacionesQ,
        { includeMetadataChanges: true },
        (snap) => {
          trackers.cotizaciones.pending = snap.metadata.hasPendingWrites;
          trackers.cotizaciones.cache = snap.metadata.fromCache;
          recompute();
        }
      )
    );

    unsubs.push(
      onSnapshot(
        materialesQ,
        { includeMetadataChanges: true },
        (snap) => {
          trackers.materiales.pending = snap.metadata.hasPendingWrites;
          trackers.materiales.cache = snap.metadata.fromCache;
          recompute();
        }
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [user?.uid]);

  useEffect(() => {
    // Máquina de estados
    if (!isOnline) {
      // Si estás offline y hay pendientes, lo más útil es decir “Pendiente de subir”
      setState(anyPendingWrites ? 'PENDING' : 'OFFLINE');
      setShow(true);
      return;
    }

    // Online
    if (anyPendingWrites) {
      setState('SYNCING');
      setShow(true);
      return;
    }

    // Online + sin pendientes
    // Si venimos de cache o acabamos de sincronizar, mostramos “Todo al día” breve
    setState('UP_TO_DATE');
    setShow(true);

    const t = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(t);
  }, [isOnline, anyPendingWrites, anyFromCache]);

  if (!show) return null;

  const text =
    state === 'OFFLINE'
      ? 'Sin internet'
      : state === 'PENDING'
      ? 'Pendiente de subir'
      : state === 'SYNCING'
      ? 'Sincronizando…'
      : 'Todo al día';

  return <Badge state={state} text={text} />;
}
