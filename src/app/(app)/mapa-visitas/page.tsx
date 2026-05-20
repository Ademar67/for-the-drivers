'use client';

import { ArrowLeft, MapPin, Clock, CheckCircle2, Navigation, Phone, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { obtenerVisitas, marcarVisitaRealizada, type Visita } from '@/lib/firestore/visitas';
import { listenClientes, type ClienteFS } from '@/lib/firestore/clientes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PuntoRuta = { lat: number; lng: number };

const TIPO_COLOR: Record<string, string> = {
  visita: 'bg-blue-100 text-blue-700',
  cotizacion: 'bg-orange-100 text-orange-700',
  cobranza: 'bg-green-100 text-green-700',
  seguimiento: 'bg-purple-100 text-purple-700',
};

const TIPO_MARKER: Record<string, string> = {
  visita: 'blue',
  cotizacion: 'orange',
  cobranza: 'green',
  seguimiento: 'purple',
};

export default function MapaVisitasPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [allVisitas, setAllVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [filteredVisitas, setFilteredVisitas] = useState<Visita[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pendientes' | 'hoy'>('hoy');
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  useEffect(() => {
    let unsubClientes: (() => void) | undefined;
    async function loadData() {
      try {
        setLoading(true);
        const visitasFromDb = await obtenerVisitas();
        setAllVisitas(visitasFromDb);
        unsubClientes = listenClientes(setClientes);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => { if (unsubClientes) unsubClientes(); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).google?.maps) { initMap(); return; }
    const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
    if (existingScript) { existingScript.addEventListener('load', initMap); return () => existingScript.removeEventListener('load', initMap); }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);
    return () => { script.onload = null; };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 19.703, lng: -101.192 },
      zoom: 12,
    });
    setMap(mapInstance);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let visitasToShow = allVisitas;
    if (activeFilter === 'pendientes') {
      visitasToShow = allVisitas.filter((v) => v.estado === 'pendiente');
    } else if (activeFilter === 'hoy') {
      visitasToShow = allVisitas.filter((v) => v.fecha === today);
    }
    visitasToShow = [...visitasToShow].sort((a, b) => a.hora.localeCompare(b.hora));
    setFilteredVisitas(visitasToShow);
  }, [allVisitas, activeFilter]);

  useEffect(() => {
    if (!map || clientes.length === 0) return;
    const clientesMap = new Map(clientes.map((c) => [c.id, c]));
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    filteredVisitas.forEach((visita, index) => {
      const cliente = clientesMap.get(visita.clienteId);
      const lat = cliente?.lat;
      const lng = cliente?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        hasValidLocations = true;
        const position = { lat, lng };
        bounds.extend(position);
        const color = TIPO_MARKER[visita.tipo] ?? 'red';
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${index + 1}. ${visita.cliente} - ${visita.hora}`,
          icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
          label: { text: String(index + 1), color: 'white', fontWeight: 'bold', fontSize: '12px' },
        });
        const infoWindowContent = `
          <div style="padding:8px;font-family:sans-serif;min-width:180px;">
            <strong style="font-size:14px;">${visita.cliente}</strong>
            <div style="margin-top:4px;font-size:12px;color:#666;">
              <div>⏰ ${visita.hora}</div>
              <div>📋 ${visita.tipo}</div>
              ${visita.notas ? `<div style="margin-top:4px;">📝 ${visita.notas}</div>` : ''}
            </div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
              <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color:#1a73e8;font-size:12px;font-weight:500;">
                🗺️ Abrir en Google Maps
              </a>
              <a href="/agenda?clienteId=${visita.clienteId}" style="color:#1a73e8;font-size:12px;font-weight:500;">
                📅 Ver agenda
              </a>
            </div>
          </div>
        `;
        const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
        marker.addListener('click', () => infoWindow.open(map, marker));
        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
    if (hasValidLocations && !bounds.isEmpty()) map.fitBounds(bounds);
  }, [map, filteredVisitas, clientes]);

  function obtenerPuntosDeVisitas(): PuntoRuta[] {
    const clientesMap = new Map(clientes.map((c) => [c.id, c]));
    return filteredVisitas
      .filter((v) => v.estado === 'pendiente')
      .map((visita) => {
        const cliente = clientesMap.get(visita.clienteId);
        if (typeof cliente?.lat === 'number' && typeof cliente?.lng === 'number') {
          return { lat: cliente.lat, lng: cliente.lng };
        }
        return null;
      })
      .filter((p): p is PuntoRuta => p !== null);
  }

  function abrirRutaEnGoogleMaps(puntos: PuntoRuta[], origenActual?: PuntoRuta) {
    if (!puntos.length) { alert('No hay visitas con coordenadas para navegar.'); return; }
    const destino = `${puntos[puntos.length - 1].lat},${puntos[puntos.length - 1].lng}`;
    let origin = origenActual ? `${origenActual.lat},${origenActual.lng}` : `${puntos[0].lat},${puntos[0].lng}`;
    const intermedios = origenActual ? puntos.slice(0, -1) : puntos.slice(1, -1);
    const params = new URLSearchParams({ api: '1', origin, destination: destino, travelmode: 'driving' });
    if (intermedios.length > 0) params.set('waypoints', intermedios.map((p) => `${p.lat},${p.lng}`).join('|'));
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank');
  }

  function iniciarNavegacion() {
    const puntos = obtenerPuntosDeVisitas();
    if (!puntos.length) { alert('No hay visitas pendientes con coordenadas.'); return; }
    setNavigating(true);
    if (!navigator.geolocation) { abrirRutaEnGoogleMaps(puntos); setNavigating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { abrirRutaEnGoogleMaps(puntos, { lat: pos.coords.latitude, lng: pos.coords.longitude }); setNavigating(false); },
      () => { abrirRutaEnGoogleMaps(puntos); setNavigating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  const handleMarcarRealizada = async (visita: Visita) => {
    if (!visita.id) return;
    try {
      setMarcandoId(visita.id);
      await marcarVisitaRealizada(visita.id);
      setAllVisitas(prev => prev.map(v => v.id === visita.id ? { ...v, estado: 'realizada' } : v));
    } catch (e) {
      console.error(e);
    } finally {
      setMarcandoId(null);
    }
  };

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));
  const pendientes = filteredVisitas.filter(v => v.estado === 'pendiente');
  const realizadas = filteredVisitas.filter(v => v.estado === 'realizada');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold">Mapa de Visitas</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={activeFilter === 'hoy' ? 'default' : 'outline'} onClick={() => setActiveFilter('hoy')}>Hoy</Button>
          <Button size="sm" variant={activeFilter === 'pendientes' ? 'default' : 'outline'} onClick={() => setActiveFilter('pendientes')}>Pendientes</Button>
          <Button size="sm" onClick={iniciarNavegacion} disabled={loading || navigating || pendientes.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Navigation className="mr-1 h-4 w-4" />
            {navigating ? 'Calculando...' : 'Navegar'}
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista de paradas */}
        <div className="w-80 shrink-0 overflow-y-auto border-r bg-white">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Cargando visitas...</div>
          ) : filteredVisitas.length === 0 ? (
            <div className="p-6 text-center">
              <MapPin className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Sin visitas para este filtro</p>
            </div>
          ) : (
            <div>
              {/* Progreso */}
              <div className="border-b bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{pendientes.length} pendientes</span>
                  <span className="text-green-600 font-medium">{realizadas.length} realizadas</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: filteredVisitas.length > 0 ? `${(realizadas.length / filteredVisitas.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Paradas pendientes */}
              {pendientes.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Por visitar</p>
                  {pendientes.map((visita, index) => {
                    const cliente = clientesMap.get(visita.clienteId);
                    return (
                      <div key={visita.id} className="border-b px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{visita.cliente}</p>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {visita.hora}
                              </div>
                              <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium', TIPO_COLOR[visita.tipo] ?? 'bg-slate-100 text-slate-700')}>
                                {visita.tipo}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarcarRealizada(visita)}
                            disabled={marcandoId === visita.id}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition"
                            title="Marcar como realizada"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        </div>
                        {/* Botones de accion */}
                        <div className="mt-2 flex gap-2">
                          {cliente?.telefono && (
                            <>
                              <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                                <Phone className="h-3 w-3" />Llamar
                              </a>
                              <a href={`https://wa.me/52${String(cliente.telefono).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                                <MessageCircle className="h-3 w-3" />WA
                              </a>
                            </>
                          )}
                          {typeof cliente?.lat === 'number' && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${cliente.lat},${cliente.lng}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                              <Navigation className="h-3 w-3" />Ir
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paradas realizadas */}
              {realizadas.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Realizadas</p>
                  {realizadas.map((visita) => (
                    <div key={visita.id} className="border-b px-4 py-3 opacity-60">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-600">{visita.cliente}</p>
                          <p className="text-xs text-slate-400">{visita.hora} · {visita.tipo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="relative flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <p className="text-sm text-slate-500">Cargando mapa...</p>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}