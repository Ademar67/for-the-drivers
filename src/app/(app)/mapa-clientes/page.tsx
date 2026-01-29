'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

// -----------------------------------------------------------------------------
// CONSTANTES / TIPOS
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

type TipoCliente = 'cliente' | 'prospecto' | 'inactivo';

type Punto = {
  id: string;
  nombre: string;
  tipo: TipoCliente;
  lat: number;
  lng: number;
  diaVisita?: DiaSemana;
};

type RutaGuardada = {
  id: string;
  createdAt?: any; // Timestamp
  distanciaKm: number;
  tiempoMin: number;
  clientes: {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    orden: number;
  }[];
};

// HOY (sin Domingo)
const hoyIndex = new Date().getDay(); // 0 = Domingo
const hoy: DiaSemana | null = hoyIndex === 0 ? null : DIAS_SEMANA[hoyIndex - 1];

// -----------------------------------------------------------------------------
// COMPONENTE
// -----------------------------------------------------------------------------
export default function MapaClientesPage() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const db = useFirestore();

  const [clientes, setClientes] = useState<Punto[]>([]);
  const [rutasGuardadas, setRutasGuardadas] = useState<RutaGuardada[]>([]);

  // UI
  const [vistaPanel, setVistaPanel] = useState<'plan' | 'guardadas'>('plan');

  // Ruta actual
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Punto[]>([]);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [tiempoMin, setTiempoMin] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Refs Google
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // ---------------------------------------------------------------------------
  // FIRESTORE: CLIENTES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'clientes'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Punto[] = snapshot.docs.map((ds) => {
        const d: any = ds.data();
        const dia = DIAS_SEMANA.includes(d.diaVisita) ? (d.diaVisita as DiaSemana) : undefined;

        return {
          id: ds.id,
          nombre: d.nombre ?? 'Sin nombre',
          tipo: (d.tipo ?? 'cliente') as TipoCliente,
          lat: Number(d.lat),
          lng: Number(d.lng),
          diaVisita: dia,
        };
      });

      setClientes(data);
    });

    return () => unsub();
  }, [db]);

  // ---------------------------------------------------------------------------
  // FIRESTORE: RUTAS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'rutas'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: RutaGuardada[] = snapshot.docs.map((ds) => {
        const d: any = ds.data();
        return {
          id: ds.id,
          createdAt: d.createdAt,
          distanciaKm: Number(d.distanciaKm ?? 0),
          tiempoMin: Number(d.tiempoMin ?? 0),
          clientes: Array.isArray(d.clientes) ? d.clientes : [],
        };
      });
      setRutasGuardadas(data);
    });

    return () => unsub();
  }, [db]);

  // ---------------------------------------------------------------------------
  // GOOGLE MAPS: CARGA SCRIPT + INIT
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMap = () => {
    if (!mapDivRef.current) return;

    const m = new google.maps.Map(mapDivRef.current, {
      center: { lat: 19.4326, lng: -99.1332 }, // fallback México
      zoom: 6,
    });

    setMap(m);
  };

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  const iconColorPorTipo = (tipo: TipoCliente) => {
    if (tipo === 'cliente') return 'blue';
    if (tipo === 'prospecto') return 'green';
    return 'yellow'; // inactivo
  };

  const ordenarRutaPorSeleccion = (id: string) => rutaSeleccionada.findIndex((c) => c.id === id) + 1;

  const centrarCliente = (clienteId: string) => {
    if (!map) return;
    const marker = markersRef.current.get(clienteId);
    if (!marker) return;
    const pos = marker.getPosition();
    if (!pos) return;
    map.panTo(pos);
    map.setZoom(15);
  };

  const abrirInfoWindow = (punto: Punto, marker: google.maps.Marker) => {
    if (!map || !db) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const opcionesDias = DIAS_SEMANA.map(
      (dia) =>
        `<option value="${dia}" ${punto.diaVisita === dia ? 'selected' : ''}>${dia}</option>`
    ).join('');

    infoWindowRef.current.setContent(`
      <div style="min-width:240px">
        <div style="font-weight:700;margin-bottom:4px">${punto.nombre}</div>
        <div style="font-size:12px;color:#666;margin-bottom:10px">Tipo: ${punto.tipo}</div>

        <label style="font-size:12px">Día de visita</label><br/>
        <select id="diaVisitaSelect" style="margin-top:6px;width:100%">
          <option value="">Sin asignar</option>
          ${opcionesDias}
        </select>

        <div id="estadoGuardado" style="margin-top:8px;font-size:12px;color:green;"></div>
      </div>
    `);

    infoWindowRef.current.open(map, marker);

    google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
      const select = document.getElementById('diaVisitaSelect') as HTMLSelectElement | null;
      if (!select) return;

      select.addEventListener('change', async (e) => {
        const nuevoDia = (e.target as HTMLSelectElement).value as DiaSemana | '';

        await updateDoc(doc(db, 'clientes', punto.id), {
          diaVisita: nuevoDia || null,
        });

        const estado = document.getElementById('estadoGuardado');
        if (estado) estado.innerText = '✔ Guardado';
      });
    });
  };

  // ---------------------------------------------------------------------------
  // MARCADORES + FITBOUNDS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map) return;

    // limpiar markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    if (!clientes.length) return;

    const bounds = new google.maps.LatLngBounds();

    clientes.forEach((c) => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number' || isNaN(c.lat) || isNaN(c.lng)) return;
      
      const marker = new google.maps.Marker({
        map,
        position: { lat: c.lat, lng: c.lng },
        title: c.nombre,
        icon: `http://maps.google.com/mapfiles/ms/icons/${iconColorPorTipo(c.tipo)}-dot.png`,
      });

      marker.addListener('click', () => abrirInfoWindow(c, marker));

      const pos = marker.getPosition();
      if (pos) bounds.extend(pos);

      markersRef.current.set(c.id, marker);
    });

    if (markersRef.current.size > 0) {
        map.fitBounds(bounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, clientes]);

  // ---------------------------------------------------------------------------
  // AGENDA POR DÍA
  // ---------------------------------------------------------------------------
  const clientesPorDia = useMemo(() => {
    const acc: Record<DiaSemana, Punto[]> = {
      Lunes: [],
      Martes: [],
      Miércoles: [],
      Jueves: [],
      Viernes: [],
      Sábado: [],
    };

    clientes.forEach((c) => {
      if (c.diaVisita && acc[c.diaVisita]) acc[c.diaVisita].push(c);
    });

    return acc;
  }, [clientes]);

  // ---------------------------------------------------------------------------
  // SELECCIÓN ORDENADA (CHECKBOX)
  // ---------------------------------------------------------------------------
  const toggleRuta = (cliente: Punto) => {
    setRutaSeleccionada((prev) => {
      const existe = prev.some((c) => c.id === cliente.id);
      if (existe) return prev.filter((c) => c.id !== cliente.id);
      return [...prev, cliente];
    });
  };

  // ---------------------------------------------------------------------------
  // DIRECTIONS: TRAZAR / LIMPIAR
  // ---------------------------------------------------------------------------
  const trazarRuta = () => {
    if (!map || rutaSeleccionada.length < 2) return;

    setDistanciaKm(null);
    setTiempoMin(null);

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 },
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
        origin: { lat: origen.lat, lng: origen.lng },
        destination: { lat: destino.lat, lng: destino.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);

          let totalDist = 0; // metros
          let totalTime = 0; // segundos
          result.routes[0].legs.forEach((leg) => {
            totalDist += leg.distance?.value || 0;
            totalTime += leg.duration?.value || 0;
          });

          setDistanciaKm(Math.round((totalDist / 1000) * 10) / 10);
          setTiempoMin(Math.round(totalTime / 60));
        }
      }
    );
  };

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
  // GUARDAR RUTA
  // ---------------------------------------------------------------------------
  const guardarRuta = async () => {
    if (!db || rutaSeleccionada.length < 2 || distanciaKm === null || tiempoMin === null) return;

    setGuardando(true);
    try {
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
      alert('Ruta guardada correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar la ruta');
    } finally {
      setGuardando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CARGAR RUTA GUARDADA (reutiliza selección + re-dibuja)
  // ---------------------------------------------------------------------------
  const cargarRutaGuardada = (ruta: RutaGuardada) => {
    // reconstruir puntos ordenados, intentando tomar tipo/día desde clientes actuales
    const ordenados = [...(ruta.clientes || [])].sort((a, b) => a.orden - b.orden);

    const puntos: Punto[] = ordenados.map((rc) => {
      const encontrado = clientes.find((c) => c.id === rc.id);
      return {
        id: rc.id,
        nombre: rc.nombre ?? encontrado?.nombre ?? 'Cliente',
        lat: rc.lat,
        lng: rc.lng,
        tipo: encontrado?.tipo ?? 'cliente',
        diaVisita: encontrado?.diaVisita,
      };
    });

    setRutaSeleccionada(puntos);
    setDistanciaKm(ruta.distanciaKm ?? null);
    setTiempoMin(ruta.tiempoMin ?? null);

    // dibujar con directions usando esos puntos
    // (si quieres, igual puedes volver a presionar "Trazar Ruta", pero aquí lo hacemos directo)
    setTimeout(() => {
      trazarRutaConPuntos(puntos);
    }, 0);
  };

  const trazarRutaConPuntos = (puntos: Punto[]) => {
    if (!map || puntos.length < 2) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 },
      });
      directionsRendererRef.current.setMap(map);
    }

    const service = new google.maps.DirectionsService();
    const origen = puntos[0];
    const destino = puntos[puntos.length - 1];
    const waypoints = puntos.slice(1, -1).map((p) => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true,
    }));

    service.route(
      {
        origin: { lat: origen.lat, lng: origen.lng },
        destination: { lat: destino.lat, lng: destino.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);
        }
      }
    );
  };

  // ---------------------------------------------------------------------------
  // NAVEGACIÓN EXTERNA (Google Maps)
  // ---------------------------------------------------------------------------
  const iniciarNavegacion = () => {
    if (rutaSeleccionada.length < 2) return;

    const origen = rutaSeleccionada[0];
    const destino = rutaSeleccionada[rutaSeleccionada.length - 1];

    const waypoints = rutaSeleccionada
      .slice(1, -1)
      .map((c) => `${c.lat},${c.lng}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${origen.lat},${origen.lng}`;
    url += `&destination=${destino.lat},${destino.lng}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    url += `&travelmode=driving`;

    window.open(url, '_blank');
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-[calc(100vh-6rem)] w-full">
      {/* PANEL IZQUIERDO */}
      <div className="w-[420px] border-r bg-white p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setVistaPanel('plan')}
            className={`px-3 py-2 rounded text-sm ${
              vistaPanel === 'plan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            Planeación
          </button>
          <button
            onClick={() => setVistaPanel('guardadas')}
            className={`px-3 py-2 rounded text-sm ${
              vistaPanel === 'guardadas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            Rutas guardadas
          </button>
        </div>

        {/* ------------------ PLANEACIÓN ------------------ */}
        {vistaPanel === 'plan' && (
          <>
            <h2 className="text-lg font-semibold mb-3">Planeación de Ruta</h2>

            {/* AGENDA + selección */}
            <div className="space-y-5">
              {DIAS_SEMANA.map((dia) => {
                const lista = clientesPorDia[dia] || [];
                if (!lista.length) return null;

                const esHoy = hoy === dia;

                return (
                  <div key={dia}>
                    <div className={`text-sm font-semibold mb-2 ${esHoy ? 'text-blue-600' : 'text-gray-700'}`}>
                      {esHoy ? `👉 ${dia} (HOY)` : dia}
                    </div>

                    <div className="space-y-2">
                      {lista.map((c) => {
                        const orden = ordenarRutaPorSeleccion(c.id);
                        const seleccionado = orden > 0;

                        return (
                          <div key={c.id} className="flex items-center gap-2 border p-2 rounded">
                            <input type="checkbox" checked={seleccionado} onChange={() => toggleRuta(c)} />
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => centrarCliente(c.id)}
                              title="Centrar en el mapa"
                            >
                              <div className="text-sm font-medium">{c.nombre}</div>
                              <div className="text-xs text-gray-500">{c.tipo}</div>
                            </div>
                            {seleccionado && (
                              <span className="text-xs font-bold text-blue-600">#{orden}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones */}
            <button
              onClick={trazarRuta}
              disabled={rutaSeleccionada.length < 2}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              Trazar Ruta
            </button>

            <button
              onClick={guardarRuta}
              disabled={guardando || rutaSeleccionada.length < 2 || distanciaKm === null || tiempoMin === null}
              className="w-full mt-2 bg-green-600 text-white py-2 rounded disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar Ruta'}
            </button>

            <button
              onClick={limpiarRuta}
              className="w-full mt-2 bg-gray-200 text-gray-800 py-2 rounded"
            >
              Limpiar Ruta
            </button>

            <button
              onClick={iniciarNavegacion}
              disabled={rutaSeleccionada.length < 2}
              className="w-full mt-2 bg-emerald-500 text-white py-2 rounded disabled:opacity-50"
            >
              Iniciar Navegación
            </button>

            {(distanciaKm !== null || tiempoMin !== null) && (
              <div className="mt-4 p-3 border rounded bg-gray-50 text-sm">
                {distanciaKm !== null && (
                  <div>
                    <strong>Distancia:</strong> {distanciaKm} km
                  </div>
                )}
                {tiempoMin !== null && (
                  <div>
                    <strong>Tiempo:</strong> {tiempoMin} min
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ------------------ RUTAS GUARDADAS ------------------ */}
        {vistaPanel === 'guardadas' && (
          <>
            <h2 className="text-lg font-semibold mb-3">Rutas guardadas</h2>

            {rutasGuardadas.length === 0 ? (
              <div className="text-sm text-gray-500">No hay rutas guardadas</div>
            ) : (
              <div className="space-y-3">
                {rutasGuardadas.map((r) => (
                  <div key={r.id} className="border rounded p-3">
                    <div className="text-sm font-medium">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : 'Sin fecha'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {r.distanciaKm} km · {r.tiempoMin} min · {r.clientes?.length ?? 0} clientes
                    </div>

                    <button
                      onClick={() => cargarRutaGuardada(r)}
                      className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
                    >
                      Cargar ruta
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setVistaPanel('plan')}
              className="w-full mt-4 bg-gray-200 text-gray-800 py-2 rounded"
            >
              Volver a Planeación
            </button>
          </>
        )}
      </div>

      {/* MAPA */}
      <div className="flex-1">
        <div ref={mapDivRef} className="w-full h-full" />
      </div>
    </div>
  );
}
