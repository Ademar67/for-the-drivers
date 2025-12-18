'use client';

import { useEffect, useRef, useState } from 'react';

type Punto = {
  id: string;
  nombre: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  lat: number;
  lng: number;
};

export default function MapaClientes() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'cliente' | 'prospecto' | 'inactivo'>('todos');
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // 👉 datos de ejemplo (luego los jalas de Firestore)
  const puntos: Punto[] = [
    {
      id: '1',
      nombre: 'Cliente Activo',
      tipo: 'cliente',
      lat: 19.243,
      lng: -103.728,
    },
    {
      id: '2',
      nombre: 'Prospecto Nuevo',
      tipo: 'prospecto',
      lat: 19.255,
      lng: -103.75,
    },
    {
      id: '3',
      nombre: 'Cliente Inactivo',
      tipo: 'inactivo',
      lat: 19.23,
      lng: -103.71,
    },
  ];

  // Cargar Google Maps
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).google) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  const initMap = () => {
    // The user has changed the ref name to 'map', so we need to get it by ID.
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const mapa = new google.maps.Map(mapElement, {
      center: { lat: 19.243, lng: -103.728 },
      zoom: 12,
    });

    setMap(mapa);
  };

  // Pintar marcadores y aplicar filtros
  useEffect(() => {
    if (!map) return;

    // 1. Limpiar marcadores anteriores del mapa
    markers.forEach(marker => marker.setMap(null));
    const nuevosMarkers: google.maps.Marker[] = [];

    // 2. Filtrar y crear nuevos marcadores
    puntos
      .filter(punto => filtro === 'todos' || punto.tipo === filtro)
      .forEach(punto => {
        let color;
        switch (punto.tipo) {
          case 'cliente':
            color = 'blue';
            break;
          case 'prospecto':
            color = 'green';
            break;
          case 'inactivo':
            color = 'gray';
            break;
        }

        const marker = new google.maps.Marker({
          position: { lat: punto.lat, lng: punto.lng },
          map,
          title: punto.nombre,
          icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        });

        const info = new google.maps.InfoWindow({
            content: `
              <strong>${punto.nombre}</strong><br/>
              Tipo: ${punto.tipo}
            `,
          });
    
          marker.addListener('click', () => {
            info.open(map, marker);
          });

        nuevosMarkers.push(marker);
      });

    // 3. Actualizar el estado con los nuevos marcadores
    setMarkers(nuevosMarkers);

  }, [map, filtro]); // Se ejecuta cuando cambia el mapa o el filtro

  return (
  <div className="flex h-screen w-full">
    
    {/* PANEL IZQUIERDO */}
    <div className="w-80 border-r bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">
        Agenda de Visitas
      </h2>

      <p className="text-sm text-gray-500">
        (Panel en construcción)
      </p>
    </div>

    {/* MAPA */}
    <div className="flex-1">
      <div id="map" className="w-full h-full" />
    </div>

  </div>
);
}
