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
  'Domingo',
];

const hoyIndex = new Date().getDay(); // 0 = Domingo
const hoy = hoyIndex === 0 ? 'Domingo' : DIAS_SEMANA[hoyIndex - 1];

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------
type Punto = {
  id: string;
  nombre: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  lat: number;
  lng: number;
  diaVisita?: string;
};

// -----------------------------------------------------------------------------
// COMPONENTE
// -----------------------------------------------------------------------------
export default function MapaClientes() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [filtro, setFiltro] = useState<
    'todos' | 'cliente' | 'prospecto' | 'inactivo'
  >('todos');

  const [clientes, setClientes] = useState<Punto[]>([]);

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
          diaVisita: d.diaVisita
            ? d.diaVisita.charAt(0).toUpperCase() +
              d.diaVisita.slice(1)
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
      center: { lat: 19.243, lng: -103.728 },
      zoom: 12,
    });

    setMap(mapa);
  };

  // ---------------------------------------------------------------------------
  // MARCADORES + EDICIÓN DE DÍA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map) return;

    markers.forEach((m) => m.setMap(null));
    const nuevos: google.maps.Marker[] = [];

    clientes
      .filter(
        (c) => filtro === 'todos' || c.tipo === filtro
      )
      .forEach((punto) => {
        let color = 'green';
        if (punto.tipo === 'prospecto') color = 'yellow';
        if (punto.tipo === 'inactivo') color = 'gray';

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
              const select =
                document.getElementById(
                  'diaVisitaSelect'
                ) as HTMLSelectElement;

              if (!select) return;

              select.addEventListener('change', async (e) => {
                const nuevoDia = (e.target as HTMLSelectElement).value;

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

        nuevos.push(marker);
      });

    setMarkers(nuevos);
  }, [map, clientes, filtro]);

  // ---------------------------------------------------------------------------
  // AGENDA POR DÍA
  // ---------------------------------------------------------------------------
  const clientesPorDia = DIAS_SEMANA.reduce(
    (acc: Record<string, Punto[]>, dia) => {
      acc[dia] = clientes.filter(
        (c) => c.diaVisita === dia
      );
      return acc;
    },
    {}
  );

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
            if (!clientesDelDia || clientesDelDia.length === 0)
              return null;

            const esHoy = dia === hoy;

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
                      className="p-2 rounded border text-sm hover:bg-gray-50"
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