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
    if (!mapRef.current) return;

    const mapa = new google.maps.Map(mapRef.current, {
      center: { lat: 19.243, lng: -103.728 },
      zoom: 12,
    });

    setMap(mapa);
  };

  // Pintar marcadores
  useEffect(() => {
    if (!map) return;

    puntos.forEach((punto) => {
      let color = 'blue';

      if (punto.tipo === 'prospecto') color = 'green';
      if (punto.tipo === 'inactivo') color = 'gray';

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
    });
  }, [map]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
        Mapa de Clientes
      </h1>

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '600px',
          borderRadius: 12,
          border: '1px solid #ddd',
        }}
      />
    </div>
  );
}
