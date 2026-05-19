'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Target,
  UserRound,
  CheckCircle2,
} from 'lucide-react';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  listenTimelineCliente,
  cambiarTipoCliente,
  agregarTimelineEvento,
  type TimelineEvento,
} from '@/lib/firestore/clientes';

type Prospecto = {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
  nombre: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  tipo?: string;
  estadoProspecto?: string;
  nota?: string;
  lat?: number;
  lng?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type Cotizacion = {
  id: string;
  clienteId?: string;
  clienteNombre?: string;
  total?: number;
  estado?: string;
  createdAt?: Timestamp;
  fecha?: string;
};

function formatMoney(value?: number) {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

function formatDate(ts?: Timestamp) {
  if (!ts) return 'Sin fecha';
  return ts.toDate().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function cleanPhone(phone?: string) {
  return (phone || '').replace(/\D/g, '');
}

function daysSince(ts?: Timestamp) {
  if (!ts) return null;
  const now = new Date().getTime();
  const then = ts.toDate().getTime();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export default function ProspectoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setIsUserLoading(false);
  });

  return () => unsub();
}, []);

  const prospectoId = params?.id;

  const [prospecto, setProspecto] = useState<Prospecto | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvento[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [convirtiendo, setConvirtiendo] = useState(false);

  const telefonoLimpio = useMemo(
    () => cleanPhone(prospecto?.telefono),
    [prospecto?.telefono]
  );

  const totalCotizado = useMemo(
    () => cotizaciones.reduce((acc, c) => acc + (Number(c.total) || 0), 0),
    [cotizaciones]
  );

  const diasSinContacto = useMemo(() => {
    return daysSince(prospecto?.updatedAt || prospecto?.createdAt);
  }, [prospecto?.updatedAt, prospecto?.createdAt]);

  useEffect(() => {
    const loadData = async () => {
      if (isUserLoading) return;

      if (!user?.uid) {
        setError('Necesitas iniciar sesión.');
        setLoading(false);
        return;
      }

      if (!prospectoId) {
        setError('No se encontró el ID del prospecto.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const ref = doc(db, 'clientes', prospectoId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError('No encontramos este prospecto.');
          setProspecto(null);
          return;
        }

        const data = snap.data() as Omit<Prospecto, 'id'>;

        if (data.ownerId && data.ownerId !== user.uid) {
          setError('No tienes permiso para ver este prospecto.');
          setProspecto(null);
          return;
        }

        const prospectoData: Prospecto = {
          id: snap.id,
          ...data,
        };

        setProspecto(prospectoData);

        const cotRef = collection(db, 'cotizaciones');
        const cotQ = query(
          cotRef,
          where('ownerId', '==', user.uid),
          where('clienteId', '==', prospectoId)
        );

        const cotSnap = await getDocs(cotQ);

        const cotList: Cotizacion[] = cotSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Cotizacion, 'id'>),
        }));

        cotList.sort((a, b) => {
          const da = a.createdAt?.toDate?.().getTime?.() || 0;
          const dbb = b.createdAt?.toDate?.().getTime?.() || 0;
          return dbb - da;
        });

        setCotizaciones(cotList);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la ficha del prospecto.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [prospectoId, user?.uid, isUserLoading]);
  useEffect(() => {
    if (isUserLoading) return;
    if (!user?.uid || !prospectoId) return;
  
    const unsub = listenTimelineCliente(prospectoId, setTimeline);
  
    return () => unsub();
  }, [prospectoId, user?.uid, isUserLoading]);

  const handleConvertir = async () => {
    if (!prospectoId) return;
    const confirmado = window.confirm('¿Convertir a ' + (prospecto?.nombre ?? 'este prospecto') + ' en cliente? Esta accion no se puede deshacer.');
    if (!confirmado) return;
    try {
      setConvirtiendo(true);
      await cambiarTipoCliente(prospectoId, 'cliente');
      await agregarTimelineEvento(prospectoId, {
        tipo: 'conversion',
        texto: 'Prospecto convertido a cliente.',
      });
      router.push('/clientes');
    } catch (err) {
      console.error(err);
      alert('No se pudo convertir el prospecto.');
    } finally {
      setConvirtiendo(false);
    }
  };

  const handleCall = () => {
    if (!telefonoLimpio) return;
    window.location.href = `tel:${telefonoLimpio}`;
  };

  const handleWhatsapp = () => {
    if (!telefonoLimpio) return;
    const msg = encodeURIComponent(
      `Buen día ${prospecto?.nombre || ''}, soy de Liqui Moly. Le doy seguimiento.`
    );
    window.open(`https://wa.me/52${telefonoLimpio}?text=${msg}`, '_blank');
  };

  const handleMaps = () => {
    if (prospecto?.lat && prospecto?.lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${prospecto.lat},${prospecto.lng}`,
        '_blank'
      );
      return;
    }

    const queryText = encodeURIComponent(
      `${prospecto?.domicilio || ''} ${prospecto?.ciudad || ''}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${queryText}`,
      '_blank'
    );
  };

  const handleCotizar = () => {
    router.push(`/cotizaciones/nueva?clienteId=${prospectoId}`);
  };

  const handleAgendar = () => {
    router.push(`/agenda?clienteId=${prospectoId}`);
  };

  if (loading || isUserLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
            <span className="text-sm font-medium text-slate-700">
              Cargando ficha del prospecto...
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !prospecto) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/prospectos')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">
              {error || 'No se encontró información.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <section className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <Badge className="rounded-full bg-blue-700 px-3 py-1 text-white">
            Ficha CRM
          </Badge>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-slate-950 text-white shadow-lg">
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <UserRound className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-black leading-tight">
                    {prospecto.nombre}
                  </h1>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/15 px-3 py-1">
                      {prospecto.ciudad || 'Sin ciudad'}
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1">
                      {prospecto.telefono || 'Sin teléfono'}
                    </span>
                  </div>
                </div>
              </div>

              <Badge className="rounded-full bg-emerald-500 text-white">
                {prospecto.estadoProspecto || prospecto.tipo || 'Prospecto'}
              </Badge>
            </div>

            {prospecto.domicilio && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-sm text-blue-50">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{prospecto.domicilio}</span>
              </div>
            )}

            {prospecto.nota && (
              <div className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-blue-50">
                {prospecto.nota}
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Button
            onClick={handleCall}
            disabled={!telefonoLimpio}
            className="h-16 rounded-2xl bg-slate-900 text-white"
          >
            <Phone className="mr-2 h-4 w-4" />
            Llamar
          </Button>

          <Button
            onClick={handleWhatsapp}
            disabled={!telefonoLimpio}
            className="h-16 rounded-2xl bg-emerald-600 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>

          <Button
            onClick={handleMaps}
            className="h-16 rounded-2xl bg-blue-700 text-white"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Maps
          </Button>

          <Button
            onClick={handleCotizar}
            className="h-16 rounded-2xl bg-red-600 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Cotizar
          </Button>

          <Button
            onClick={handleAgendar}
            className="col-span-2 h-16 rounded-2xl bg-amber-500 text-slate-950 md:col-span-1"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Agendar
          </Button>

          <Button
            onClick={handleConvertir}
            disabled={convirtiendo}
            className="col-span-2 h-16 rounded-2xl bg-green-600 text-white hover:bg-green-700 md:col-span-5"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {convirtiendo ? 'Convirtiendo...' : 'Convertir a Cliente'}
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <Clock className="h-4 w-4" />
              Sin contacto
            </div>
            <p className="text-2xl font-black text-slate-900">
              {diasSinContacto === null ? '-' : diasSinContacto}
            </p>
            <p className="text-xs text-slate-500">días</p>
          </div>

          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <FileText className="h-4 w-4" />
              Cotizaciones
            </div>
            <p className="text-2xl font-black text-slate-900">
              {cotizaciones.length}
            </p>
            <p className="text-xs text-slate-500">relacionadas</p>
          </div>

          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <Target className="h-4 w-4" />
              Potencial
            </div>
            <p className="text-2xl font-black text-slate-900">
              {formatMoney(totalCotizado)}
            </p>
            <p className="text-xs text-slate-500">cotizado</p>
          </div>

          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <BadgeCheck className="h-4 w-4" />
              Estado
            </div>
            <p className="text-lg font-black text-slate-900">
              {prospecto.estadoProspecto || prospecto.tipo || 'Prospecto'}
            </p>
            <p className="text-xs text-slate-500">comercial</p>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Timeline comercial
              </h2>
              <p className="text-sm text-slate-500">
                Primer historial base del prospecto.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">
                Prospecto registrado
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(prospecto.createdAt)}
              </p>
            </div>

            {cotizaciones.slice(0, 3).map((cot) => (
              <div key={cot.id} className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">
                  Cotización generada
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(cot.createdAt)} · {formatMoney(cot.total)}
                </p>
              </div>
            ))}

            {cotizaciones.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
                Todavía no hay cotizaciones. Usa el botón rojo de Cotizar para
                iniciar seguimiento.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Cotizaciones
              </h2>
              <p className="text-sm text-slate-500">
                Cotizaciones ligadas a este prospecto.
              </p>
            </div>

            <Button size="sm" onClick={handleCotizar}>
              Nueva
            </Button>
          </div>

          <div className="space-y-3">
            {cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {formatMoney(cot.total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(cot.createdAt)} · {cot.estado || 'Sin estado'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/cotizaciones`)}
                >
                  Ver
                </Button>
              </div>
            ))}

            {cotizaciones.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-slate-50 p-5 text-center">
                <p className="text-sm font-bold text-slate-700">
                  Sin cotizaciones todavía
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Genera la primera desde esta ficha.
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-3xl border bg-white p-4 shadow-sm">
  <div className="mb-4">
    <h2 className="text-lg font-black text-slate-900">
      Timeline
    </h2>

    <p className="text-sm text-slate-500">
      Actividad y seguimiento del prospecto.
    </p>
  </div>

  <div className="space-y-3">
    {timeline.length === 0 && (
      <div className="rounded-2xl border border-dashed bg-slate-50 p-5 text-center">
        <p className="text-sm font-bold text-slate-700">
          Sin actividad todavía
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Aquí aparecerán llamadas, cotizaciones y seguimientos.
        </p>
      </div>
    )}

    {timeline.map((evento) => (
      <div
        key={evento.id}
        className="rounded-2xl border bg-slate-50 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">
              {evento.tipo}
            </p>

            <p className="mt-1 text-sm text-slate-600">
            {evento.texto}
            </p>
          </div>

          <Badge variant="secondary">
            {formatDate(evento.createdAt)}
          </Badge>
        </div>
      </div>
    ))}
  </div>
</section>
      </div>
    </main>
  );
}