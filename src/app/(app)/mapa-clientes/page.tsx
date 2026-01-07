'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  addDoc,
  serverTimestamp,
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

  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [tiempoMin, setTiempoMin] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const markersRef = useRef<Map<string, google.maps.Marker>>(
    new Map()
  );

  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(null);

  // ---------------------------------------------------------------------------
  // 🔥 CLIENTES
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
  // MARCADORES
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
  // SELECCIÓN
  // ---------------------------------------------------------------------------
  const toggleRuta = (cliente: Punto) => {
    setRutaSeleccionada((prev) => {
      const existe = prev.find((c) => c.id === cliente.id);
      return existe
        ? prev.filter((c) => c.id !== cliente.id)
        : [...prev, cliente];
    });
  };

  const ordenEnRuta = (id: string) =>
    rutaSeleccionada.findIndex((c) => c.id === id) + 1;

  // ---------------------------------------------------------------------------
  // TRAZAR
  // ---------------------------------------------------------------------------
  const trazarRuta = () => {
    if (!map || rutaSeleccionada.length < 2) return;

    setDistanciaKm(null);
    setTiempoMin(null);

    if (!directionsRendererRef.current) {
      directionsRendererRef.current =
        new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#FF0000',
            strokeWeight: 5,
          },
        });

      directionsRendererRef.current.setMap(map);
    }

    const service = new google.maps.DirectionsService();
    const origen = rutaSeleccionada[0];
    const destino = rutaSeleccionada[rutaSeleccionada.length - 1];

    const waypoints = rutaSeleccionada.slice(1, -1).map((p) => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true,
    }));

    service.route(
      {
        origin: origen,
        destination: destino,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current!.setDirections(result);

          let dist = 0;
          let time = 0;
          result.routes[0].legs.forEach((leg) => {
            dist += leg.distance?.value || 0;
            time += leg.duration?.value || 0;
          });

          setDistanciaKm(Math.round((dist / 1000) * 10) / 10);
          setTiempoMin(Math.round(time / 60));
        }
      }
    );
  };

  // ---------------------------------------------------------------------------
  // 🧹 LIMPIAR RUTA (RESTABLECIDO)
  // ---------------------------------------------------------------------------
  const limpiarRuta = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    setRutaSeleccionada([]);
    setDistanciaKm(null);
    setTiempoMin(null);
  };

  // ---------------------------------------------------------------------------
  // 💾 GUARDAR
  // ---------------------------------------------------------------------------
  const guardarRuta = async () => {
    if (
      rutaSeleccionada.length < 2 ||
      distanciaKm === null ||
      tiempoMin === null
    )
      return;

    setGuardando(true);

    await addDoc(collection(db, 'rutas'), {
      createdAt: serverTimestamp(),
      distanciaKm,
      tiempoMin,
      clientes: rutaSeleccionada.map((c, i) => ({
        id: c.id,
        nombre: c.nombre,
        lat: c.lat,
        lng: c.lng,
        orden: i + 1,
      })),
    });

    setGuardando(false);
    alert('Ruta guardada correctamente');
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full">
      <div className="w-96 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          Planeación de Ruta
        </h2>

        {DIAS_SEMANA.map((dia) => {
          const lista = clientes.filter(
            (c) => c.diaVisita === dia
          );
          if (!lista.length) return null;

          return (
            <div key={dia} className="mb-6">
              <h3 className="font-semibold text-sm mb-2">
                {dia}
              </h3>

              {lista.map((c) => {
                const orden = ordenEnRuta(c.id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 border p-2 rounded mb-2"
                  >
                    <input
                      type="checkbox"
                      checked={orden > 0}
                      onChange={() => toggleRuta(c)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {c.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.tipo}
                      </div>
                    </div>
                    {orden > 0 && (
                      <span className="text-xs font-bold text-blue-600">
                        #{orden}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        <button
          onClick={trazarRuta}
          disabled={rutaSeleccionada.length < 2}
          className="w-full bg-blue-600 text-white py-2 rounded mt-2"
        >
          Trazar Ruta
        </button>

        <button
          onClick={guardarRuta}
          className="w-full bg-green-600 text-white py-2 rounded mt-2"
        >
          Guardar Ruta
        </button>

        <button
          onClick={limpiarRuta}
          className="w-full bg-gray-200 text-gray-800 py-2 rounded mt-2"
        >
          Limpiar Ruta
        </button>

        {distanciaKm !== null && tiempoMin !== null && (
          <div className="mt-4 p-3 border rounded bg-gray-50 text-sm">
            <div>Distancia: {distanciaKm} km</div>
            <div>Tiempo: {tiempoMin} min</div>
          </div>
        )}
      </div>

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
