
'use client';

import { useEffect, useRef, useState } from 'react';
import { obtenerVisitas, Visita } from '@/lib/firestore/visitas';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { Button } from '@/components/ui/button';

export default function MapaVisitasPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [allVisitas, setAllVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [filteredVisitas, setFilteredVisitas] = useState<Visita[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pendientes' | 'hoy'>('pendientes');
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const visitasFromDb = await obtenerVisitas();
        setAllVisitas(visitasFromDb);
        
        const unsubClientes = listenClientes(setClientes);
        return () => unsubClientes(); // Cleanup listener
        
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Cargar Google Maps
  useEffect(() => {
    if (typeof window === 'undefined' || (window as any).google) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      // Clean up script tag
      const scripts = document.head.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.startsWith('https://maps.googleapis.com')) {
          scripts[i].remove();
        }
      }
    }
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 19.243, lng: -103.728 }, // Default center
      zoom: 12,
    });
    setMap(mapInstance);
  };

  // 3. Aplicar filtros a las visitas
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    let visitasToShow = allVisitas;

    if (activeFilter === 'pendientes') {
        visitasToShow = allVisitas.filter(v => v.estado === 'pendiente');
    } else if (activeFilter === 'hoy') {
        visitasToShow = allVisitas.filter(v => v.fecha === today);
    }
    
    setFilteredVisitas(visitasToShow);
  }, [allVisitas, activeFilter]);


  // 4. Renderizar marcadores en el mapa
  useEffect(() => {
    if (!map || clientes.length === 0) return;

    const clientesMap = new Map(clientes.map(c => [c.id, c]));

    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    filteredVisitas.forEach(visita => {
      const cliente = clientesMap.get(visita.clienteId);
      // @ts-ignore
      const lat = cliente?.lat, lng = cliente?.lng;


      if (lat && lng) {
        hasValidLocations = true;
        const position = { lat, lng };
        bounds.extend(position);

        let color;
        switch (visita.tipo) {
          case 'visita': color = 'blue'; break;
          case 'cotizacion': color = 'orange'; break;
          case 'cobranza': color = 'green'; break;
          default: color = 'red';
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
        </div>
      </div>
      <div className="flex-1 relative">
        {loading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10"><p>Cargando mapa y visitas...</p></div>}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
