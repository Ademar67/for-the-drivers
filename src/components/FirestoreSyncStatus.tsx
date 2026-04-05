'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/firebase/config';
import {
  collection,
  limit,
  onSnapshot,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { useAuth } from '@/lib/useAuth';

type SyncState = 'OFFLINE' | 'PENDING' | 'SYNCING' | 'UP_TO_DATE';

type TrackerMap = Record<string, { pending: boolean; cache: boolean }>;

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
    <div className="fixed right-2 top-2 z-[9999]">
      <div
        className={`rounded-full border px-3 py-1 text-xs backdrop-blur ${cls}`}
      >
        {text}
      </div>
    </div>
  );
}

export default function FirestoreSyncStatus() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [anyPendingWrites, setAnyPendingWrites] = useState(false);
  const [anyFromCache, setAnyFromCache] = useState(false);
  const [state, setState] = useState<SyncState>('UP_TO_DATE');
  const [show, setShow] = useState(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setAnyPendingWrites(false);
      setAnyFromCache(false);
      return;
    }

    const trackers: TrackerMap = {
      clientes: { pending: false, cache: false },
      cotizaciones: { pending: false, cache: false },
      materiales: { pending: false, cache: false },
    };

    const unsubs: Unsubscribe[] = [];
    let isDisposed = false;

    const recompute = () => {
      if (isDisposed) return;

      const pending = Object.values(trackers).some((t) => t.pending);
      const cache = Object.values(trackers).some((t) => t.cache);

      setAnyPendingWrites(pending);
      setAnyFromCache(cache);
    };

    const attachListener = (
      key: keyof typeof trackers,
      collectionName: string
    ) => {
      try {
        const q = query(collection(db, collectionName), limit(1));

        const unsub = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snap) => {
            if (isDisposed) return;

            trackers[key].pending = snap.metadata.hasPendingWrites;
            trackers[key].cache = snap.metadata.fromCache;
            recompute();
          },
          (error) => {
            console.error(
              `Error en FirestoreSyncStatus escuchando "${collectionName}":`,
              error
            );

            if (isDisposed) return;

            trackers[key].pending = false;
            trackers[key].cache = false;
            recompute();
          }
        );

        unsubs.push(unsub);
      } catch (error) {
        console.error(
          `No se pudo crear listener para "${collectionName}":`,
          error
        );

        trackers[key].pending = false;
        trackers[key].cache = false;
        recompute();
      }
    };

    attachListener('clientes', 'clientes');
    attachListener('cotizaciones', 'cotizaciones');
    attachListener('materiales', 'materiales');

    return () => {
      isDisposed = true;

      for (const unsub of unsubs) {
        try {
          if (typeof unsub === 'function') {
            unsub();
          }
        } catch (error) {
          console.error('Error liberando listener de Firestore:', error);
        }
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!isOnline) {
      setState(anyPendingWrites ? 'PENDING' : 'OFFLINE');
      setShow(true);
      return;
    }

    if (anyPendingWrites) {
      setState('SYNCING');
      setShow(true);
      return;
    }

    setState('UP_TO_DATE');
    setShow(true);

    hideTimerRef.current = setTimeout(() => {
      setShow(false);
    }, 2500);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
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