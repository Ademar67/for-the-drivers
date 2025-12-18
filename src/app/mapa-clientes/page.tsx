'use client';

import { useEffect, useRef, useState } from 'react';

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const asignarDiaVisita = (clienteId: string) => {
  const index = clienteId.charCodeAt(0) % DIAS_SEMANA.length;
  return DIAS_SEMANA[index];
};

const hoyIndex = new Date().getDay(); // 0 = Domingo
const hoy =
  hoyIndex === 0 ? "Domingo" : DIAS_SEMANA[hoyIndex - 1];

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
  const [clientes, setClientes] = useState<Punto[]>([
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
     {
      id: '4',
      nombre: 'Taller "El Pistón Feliz"',
      tipo: 'cliente',
      lat: 19.248,
      lng: -103.735,
    },
    {
      id: '5',
      nombre: 'Refaccionaria "La Curva"',
      tipo: 'prospecto',
      lat: 19.252,
      lng: -103.72,
    },
    {
      id: '6',
      nombre: 'Lubricentro "Speedy"',
      tipo: 'cliente',
      lat: 19.24,
      lng: -103.74,
    },
  ]);

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
    clientes
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

  }, [map, filtro, clientes]); // Se ejecuta cuando cambia el mapa o el filtro
  
  const clientesPorDia = DIAS_SEMANA.reduce((acc: any, dia) => {
    acc[dia] = clientes.filter(
      (cliente) => asignarDiaVisita(cliente.id) === dia
    );
    return acc;
  }, {});


  return (
    <div className="flex h-screen w-full">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-80 border-r bg-white p-4">
        <h2 className="text-lg font-semibold mb-4">
          Agenda de Visitas
        </h2>

        <div className="space-y-6">
          {DIAS_SEMANA.map((dia) => {
            const clientesDelDia = clientesPorDia[dia];
            if (!clientesDelDia || clientesDelDia.length === 0) return null;

            const esHoy = dia === hoy;

            return (
              <div key={dia}>
                <h3
                  className={`text-sm font-semibold mb-2 ${
                    esHoy ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {esHoy ? `👉 ${dia} (HOY)` : dia}
                </h3>

                <ul className="space-y-2">
                  {clientesDelDia.map((cliente: any) => (
                    <li
                      key={cliente.id}
                      className="p-2 rounded border text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">{cliente.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {cliente.tipo}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1">
        <div id="map" className="w-full h-full" />
      </div>

    </div>
  );
}