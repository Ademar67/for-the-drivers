'use client';

import { useEffect, useRef, useState } from 'react';
import { obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { Button } from '@/components/ui/button';

type PuntoRuta = {
  lat: number;
  lng: number;
};

export default function MapaVisitasPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [allVisitas, setAllVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [filteredVisitas, setFilteredVisitas] = useState<Visita[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pendientes' | 'hoy'>('pendientes');
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  // 1. Cargar datos
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

    return () => {
      if (unsubClientes) unsubClientes();
    };
  }, []);

  // 2. Cargar Google Maps
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return () => {
        existingScript.removeEventListener('load', initMap);
      };
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !(window as any).google?.maps) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 19.703, lng: -101.192 },
      zoom: 12,
    });

    setMap(mapInstance);
  };

  // 3. Aplicar filtros a las visitas
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    let visitasToShow = allVisitas;

    if (activeFilter === 'pendientes') {
      visitasToShow = allVisitas.filter((v) => v.estado === 'pendiente');
    } else if (activeFilter === 'hoy') {
      visitasToShow = allVisitas.filter((v) => v.fecha === today);
    }

    setFilteredVisitas(visitasToShow);
  }, [allVisitas, activeFilter]);

  // 4. Renderizar marcadores en el mapa
  useEffect(() => {
    if (!map || clientes.length === 0) return;

    const clientesMap = new Map(clientes.map((c) => [c.id, c]));

    markers.forEach((marker) => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    filteredVisitas.forEach((visita) => {
      const cliente = clientesMap.get(visita.clienteId);
      const lat = cliente?.lat;
      const lng = cliente?.lng;

      if (typeof lat === 'number' && typeof lng === 'number') {
        hasValidLocations = true;

        const position = { lat, lng };
        bounds.extend(position);

        let color = 'red';

        switch (visita.tipo) {
          case 'visita':
            color = 'blue';
            break;
          case 'cotizacion':
            color = 'orange';
            break;
          case 'cobranza':
            color = 'green';
            break;
        }

        const marker = new google.maps.Marker({
          position,
          map,
          title: `${visita.cliente} - ${visita.hora}`,
          icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        });

        const infoWindowContent = `
          <div style="padding: 5px; font-family: sans-serif; display: flex; flex-direction: column; gap: 8px;">
            <strong style="font-size: 14px;">${visita.cliente}</strong>
            <div>
              <div>Tipo: ${visita.tipo}</div>
              <div>Hora: ${visita.hora}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
              <a href="/agenda?clienteId=${visita.clienteId}" style="color: #1a73e8; text-decoration: none; font-weight: 500; font-size: 13px;">
                Ver agenda del cliente
              </a>
              <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: none; font-weight: 500; font-size: 13px;">
                Abrir en Google Maps
              </a>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    if (hasValidLocations && !bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [map, filteredVisitas, clientes]);

  function abrirRutaEnGoogleMaps(
    puntos: PuntoRuta[],
    origenActual?: PuntoRuta
  ) {
    if (!puntos.length) {
      alert('No hay visitas con coordenadas para navegar.');
      return;
    }

    if (puntos.length === 1) {
      const destino = `${puntos[0].lat},${puntos[0].lng}`;

      if (origenActual) {
        const params = new URLSearchParams({
          api: '1',
          origin: `${origenActual.lat},${origenActual.lng}`,
          destination: destino,
          travelmode: 'driving',
        });

        const url = `https://www.google.com/maps/dir/?${params.toString()}`;
        window.open(url, '_blank');
        return;
      }

      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`;
      window.open(url, '_blank');
      return;
    }

    const destino = `${puntos[puntos.length - 1].lat},${puntos[puntos.length - 1].lng}`;
    let origin = `${puntos[0].lat},${puntos[0].lng}`;
    let intermedios = puntos.slice(1, -1);

    if (origenActual) {
      origin = `${origenActual.lat},${origenActual.lng}`;
      intermedios = puntos.slice(0, -1);
    }

    const params = new URLSearchParams({
      api: '1',
      origin,
      destination: destino,
      travelmode: 'driving',
    });

    if (intermedios.length > 0) {
      const waypoints = intermedios.map((p) => `${p.lat},${p.lng}`).join('|');
      params.set('waypoints', waypoints);
    }

    const url = `https://www.google.com/maps/dir/?${params.toString()}`;
    window.open(url, '_blank');
  }

  function obtenerPuntosDeVisitas(): PuntoRuta[] {
    const clientesMap = new Map(clientes.map((c) => [c.id, c]));

    return filteredVisitas
      .map((visita) => {
        const cliente = clientesMap.get(visita.clienteId);
        const lat = cliente?.lat;
        const lng = cliente?.lng;

        if (typeof lat === 'number' && typeof lng === 'number') {
          return { lat, lng };
        }

        return null;
      })
      .filter((punto): punto is PuntoRuta => punto !== null);
  }

  function iniciarNavegacion() {
    const puntos = obtenerPuntosDeVisitas();

    if (!puntos.length) {
      alert('No hay visitas con coordenadas para navegar.');
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocalización no soportada por este navegador.');
      abrirRutaEnGoogleMaps(puntos);
      return;
    }

    setNavigating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origenActual = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        abrirRutaEnGoogleMaps(puntos, origenActual);
        setNavigating(false);
      },
      (error) => {
        console.warn('No se pudo obtener la ubicación actual:', error);
        abrirRutaEnGoogleMaps(puntos);
        setNavigating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mapa de Visitas</h1>

        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'pendientes' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('pendientes')}
          >
            Pendientes
          </Button>

          <Button
            variant={activeFilter === 'hoy' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('hoy')}
          >
            Hoy
          </Button>

          <Button
            variant="default"
            onClick={iniciarNavegacion}
            disabled={loading || navigating || filteredVisitas.length === 0}
          >
            {navigating ? 'Obteniendo ubicación...' : 'Iniciar Navegación'}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <p>Cargando mapa y visitas...</p>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}