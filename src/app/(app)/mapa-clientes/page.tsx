'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
} from 'firebase/firestore';

// -----------------------------------------------------------------------------
// 🔥 Firebase
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------------------------------------------------------
// CONSTANTES
// -----------------------------------------------------------------------------
const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

type DiaSemana = (typeof DIAS_SEMANA)[number];

const hoyIndex = new Date().getDay();
const hoy: DiaSemana | null =
  hoyIndex === 0 ? null : DIAS_SEMANA[hoyIndex - 1];

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------
type Punto = {
  id: string;
  nombre: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  lat: number;
  lng: number;
  diaVisita?: DiaSemana;
};

// -----------------------------------------------------------------------------
// COMPONENTE
// -----------------------------------------------------------------------------
export default function MapaClientes() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [clientes, setClientes] = useState<Punto[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Punto[]>([]);

  const markersRef = useRef<Map<string, google.maps.Marker>>(
    new Map()
  );

  // ---------------------------------------------------------------------------
  // 🔥 CARGAR CLIENTES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const q = query(collection(db, 'clientes'));

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Punto[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          nombre: d.nombre,
          lat: d.lat,
          lng: d.lng,
          tipo: d.tipo,
          diaVisita: DIAS_SEMANA.includes(d.diaVisita)
            ? d.diaVisita
            : undefined,
        };
      });
      setClientes(data);
    });

    return () => unsub();
  }, []);

  // ---------------------------------------------------------------------------
  // MAPA
  // ---------------------------------------------------------------------------
  useEffect(() => {
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
      center: { lat: 19.4326, lng: -99.1332 },
      zoom: 6,
    });

    setMap(mapa);
  };

  // ---------------------------------------------------------------------------
  // MARCADORES + AUTO ZOOM
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map || clientes.length === 0) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    const bounds = new google.maps.LatLngBounds();

    clientes.forEach((punto) => {
      let color = 'blue';
      if (punto.tipo === 'prospecto') color = 'green';
      if (punto.tipo === 'inactivo') color = 'yellow';

      const marker = new google.maps.Marker({
        map,
        position: { lat: punto.lat, lng: punto.lng },
        title: punto.nombre,
        icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      });

      bounds.extend({ lat: punto.lat, lng: punto.lng });
      markersRef.current.set(punto.id, marker);
    });

    map.fitBounds(bounds);
  }, [map, clientes]);

  // ---------------------------------------------------------------------------
  // SELECCIÓN DE RUTA
  // ---------------------------------------------------------------------------
  const toggleRuta = (cliente: Punto) => {
    setRutaSeleccionada((prev) => {
      const existe = prev.find((c) => c.id === cliente.id);
      if (existe) {
        return prev.filter((c) => c.id !== cliente.id);
      }
      return [...prev, cliente];
    });
  };

  const ordenEnRuta = (id: string) =>
    rutaSeleccionada.findIndex((c) => c.id === id) + 1;

  // ---------------------------------------------------------------------------
  // AGENDA
  // ---------------------------------------------------------------------------
  const clientesPorDia: Record<DiaSemana, Punto[]> =
    DIAS_SEMANA.reduce((acc, dia) => {
      acc[dia] = clientes.filter(
        (c) => c.diaVisita === dia
      );
      return acc;
    }, {} as Record<DiaSemana, Punto[]>);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full">
      {/* PANEL IZQUIERDO */}
      <div className="w-96 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          Planeación de Ruta
        </h2>

        {DIAS_SEMANA.map((dia) => {
          const clientesDelDia = clientesPorDia[dia];
          if (!clientesDelDia.length) return null;

          return (
            <div key={dia} className="mb-6">
              <h3 className="font-semibold text-sm mb-2">
                {dia}
              </h3>

              <ul className="space-y-2">
                {clientesDelDia.map((cliente) => {
                  const orden = ordenEnRuta(cliente.id);
                  const seleccionado = orden > 0;

                  return (
                    <li
                      key={cliente.id}
                      className="flex items-center gap-2 border p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() =>
                          toggleRuta(cliente)
                        }
                      />

                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {cliente.nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cliente.tipo}
                        </div>
                      </div>

                      {seleccionado && (
                        <span className="text-xs font-bold text-blue-600">
                          #{orden}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* MAPA */}
      <div className="flex-1">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '100vh' }}
        />
      </div>
    </div>
  );
}