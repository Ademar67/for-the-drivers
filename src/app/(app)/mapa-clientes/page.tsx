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

const hoyIndex = new Date().getDay(); // 0 = Domingo
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

  // 👉 referencia id → marker
  const markersRef = useRef<Map<string, google.maps.Marker>>(
    new Map()
  );

  // ---------------------------------------------------------------------------
  // 🔥 CARGAR CLIENTES DESDE FIRESTORE
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
  // CARGAR GOOGLE MAPS
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
      // centro solo como fallback
      center: { lat: 19.4326, lng: -99.1332 }, // México
      zoom: 6,
    });

    setMap(mapa);
  };

  // ---------------------------------------------------------------------------
  // MARCADORES + AUTO-CENTRADO
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    if (clientes.length === 0) return;

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

      const infoWindow = new google.maps.InfoWindow();

      marker.addListener('click', () => {
        const opcionesDias = DIAS_SEMANA.map(
          (dia) =>
            `<option value="${dia}" ${
              punto.diaVisita === dia ? 'selected' : ''
            }>${dia}</option>`
        ).join('');

        infoWindow.setContent(`
          <div style="min-width:220px">
            <strong>${punto.nombre}</strong><br/>
            <small>Tipo: ${punto.tipo}</small><br/><br/>

            <label>Día de visita</label><br/>
            <select id="diaVisitaSelect">
              <option value="">Sin asignar</option>
              ${opcionesDias}
            </select>

            <div id="estadoGuardado"
                 style="margin-top:6px;font-size:12px;color:green;"></div>
          </div>
        `);

        infoWindow.open(map, marker);

        google.maps.event.addListenerOnce(
          infoWindow,
          'domready',
          () => {
            const select = document.getElementById(
              'diaVisitaSelect'
            ) as HTMLSelectElement | null;

            if (!select) return;

            select.addEventListener('change', async (e) => {
              const nuevoDia = (e.target as HTMLSelectElement)
                .value as DiaSemana | '';

              await updateDoc(
                doc(db, 'clientes', punto.id),
                {
                  diaVisita: nuevoDia || null,
                }
              );

              const estado =
                document.getElementById('estadoGuardado');
              if (estado) estado.innerText = '✔ Guardado';
            });
          }
        );
      });

      markersRef.current.set(punto.id, marker);
      bounds.extend({ lat: punto.lat, lng: punto.lng });
    });

    // 👉 AQUÍ ESTÁ LA CLAVE
    map.fitBounds(bounds);
  }, [map, clientes]);

  // ---------------------------------------------------------------------------
  // AGENDA POR DÍA
  // ---------------------------------------------------------------------------
  const clientesPorDia: Record<DiaSemana, Punto[]> =
    DIAS_SEMANA.reduce((acc, dia) => {
      acc[dia] = clientes.filter(
        (c) => c.diaVisita === dia
      );
      return acc;
    }, {} as Record<DiaSemana, Punto[]>);

  // ---------------------------------------------------------------------------
  // CENTRAR DESDE AGENDA
  // ---------------------------------------------------------------------------
  const centrarCliente = (clienteId: string) => {
    if (!map) return;

    const marker = markersRef.current.get(clienteId);
    if (!marker) return;

    map.panTo(marker.getPosition()!);
    map.setZoom(15);
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full">
      {/* PANEL IZQUIERDO */}
      <div className="w-80 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          Agenda de Visitas
        </h2>

        <div className="space-y-6">
          {DIAS_SEMANA.map((dia) => {
            const clientesDelDia = clientesPorDia[dia];
            if (!clientesDelDia.length) return null;

            const esHoy = hoy === dia;

            return (
              <div key={dia}>
                <h3
                  className={`text-sm font-semibold mb-2 ${
                    esHoy
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  {esHoy ? `👉 ${dia} (HOY)` : dia}
                </h3>

                <ul className="space-y-2">
                  {clientesDelDia.map((cliente) => (
                    <li
                      key={cliente.id}
                      onClick={() =>
                        centrarCliente(cliente.id)
                      }
                      className="p-2 rounded border text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">
                        {cliente.nombre}
                      </div>
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
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '100vh' }}
        />
      </div>
    </div>
  );
}

