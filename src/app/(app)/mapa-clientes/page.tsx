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
  createdAt?: any;
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
const hoyIndex = new Date().getDay();
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
  // HELPERS DE RUTA
  // ---------------------------------------------------------------------------
  const clienteEstaEnRuta = (clienteId: string) =>
    rutaSeleccionada.some((c) => c.id === clienteId);

  const agregarClienteARuta = (cliente: Punto) => {
    setRutaSeleccionada((prev) => {
      const existe = prev.some((c) => c.id === cliente.id);
      if (existe) return prev;
      return [...prev, cliente];
    });
  };

  const quitarClienteDeRuta = (clienteId: string) => {
    setRutaSeleccionada((prev) => prev.filter((c) => c.id !== clienteId));
  };

  const toggleRuta = (cliente: Punto) => {
    setRutaSeleccionada((prev) => {
      const existe = prev.some((c) => c.id === cliente.id);
      if (existe) return prev.filter((c) => c.id !== cliente.id);
      return [...prev, cliente];
    });
  };

  const reordenarRutaOptimizada = (
    origen: Punto,
    destino: Punto,
    intermedios: Punto[],
    waypointOrder: number[]
  ) => {
    const intermediosOrdenados = waypointOrder.map((index) => intermedios[index]);
    return [origen, ...intermediosOrdenados, destino];
  };

  // ---------------------------------------------------------------------------
  // FIRESTORE: CLIENTES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'clientes'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Punto[] = snapshot.docs.map((ds) => {
        const d: any = ds.data();
        const dia = DIAS_SEMANA.includes(d.diaVisita)
          ? (d.diaVisita as DiaSemana)
          : undefined;

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
      center: { lat: 19.4326, lng: -99.1332 },
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
    return 'yellow';
  };

  const ordenarRutaPorSeleccion = (id: string) =>
    rutaSeleccionada.findIndex((c) => c.id === id) + 1;

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

    const yaEnRuta = clienteEstaEnRuta(punto.id);

    const opcionesDias = DIAS_SEMANA.map(
      (dia) =>
        `<option value="${dia}" ${punto.diaVisita === dia ? 'selected' : ''}>${dia}</option>`
    ).join('');

    infoWindowRef.current.setContent(`
      <div style="min-width:260px;font-family:Arial,sans-serif">
        <div style="font-weight:700;font-size:16px;margin-bottom:4px">${punto.nombre}</div>
        <div style="font-size:12px;color:#666;margin-bottom:10px">Tipo: ${punto.tipo}</div>

        <label style="font-size:12px;color:#444">Día de visita</label><br/>
        <select id="diaVisitaSelect" style="margin-top:6px;width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px">
          <option value="">Sin asignar</option>
          ${opcionesDias}
        </select>

        <button
          id="guardarEnRutaBtn"
          style="
            margin-top:10px;
            width:100%;
            padding:10px 12px;
            border:none;
            border-radius:8px;
            background:${yaEnRuta ? '#ef4444' : '#2563eb'};
            color:white;
            font-weight:600;
            cursor:pointer;
          "
        >
          ${yaEnRuta ? 'Quitar de ruta' : 'Guardar en ruta'}
        </button>

        <div id="estadoGuardado" style="margin-top:8px;font-size:12px;color:green;"></div>
      </div>
    `);

    infoWindowRef.current.open(map, marker);

    google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
      const select = document.getElementById('diaVisitaSelect') as HTMLSelectElement | null;
      const btnRuta = document.getElementById('guardarEnRutaBtn') as HTMLButtonElement | null;
      const estado = document.getElementById('estadoGuardado');

      if (select) {
        select.addEventListener('change', async (e) => {
          const nuevoDia = (e.target as HTMLSelectElement).value as DiaSemana | '';

          await updateDoc(doc(db, 'clientes', punto.id), {
            diaVisita: nuevoDia || null,
          });

          if (estado) estado.innerText = '✔ Día de visita guardado';
        });
      }

      if (btnRuta) {
        btnRuta.addEventListener('click', () => {
          const existe = clienteEstaEnRuta(punto.id);

          if (existe) {
            quitarClienteDeRuta(punto.id);
            btnRuta.innerText = 'Guardar en ruta';
            btnRuta.style.background = '#2563eb';
            if (estado) estado.innerText = '✔ Cliente quitado de la ruta';
          } else {
            agregarClienteARuta(punto);
            btnRuta.innerText = 'Quitar de ruta';
            btnRuta.style.background = '#ef4444';
            if (estado) estado.innerText = '✔ Cliente agregado a la ruta';
          }
        });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // MARCADORES + FITBOUNDS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    if (!clientes.length) return;

    const bounds = new google.maps.LatLngBounds();

    clientes.forEach((c) => {
      if (
        typeof c.lat !== 'number' ||
        typeof c.lng !== 'number' ||
        isNaN(c.lat) ||
        isNaN(c.lng)
      ) {
        return;
      }

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
  }, [map, clientes, rutaSeleccionada]);

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
    const intermedios = rutaSeleccionada.slice(1, -1);

    const waypoints = intermedios.map((p) => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true,
    }));

    service.route(
      {
        origin: { lat: origen.lat, lng: origen.lng },
        destination: { lat: destino.lat, lng: destino.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);

          let totalDist = 0;
          let totalTime = 0;

          result.routes[0].legs.forEach((leg) => {
            totalDist += leg.distance?.value || 0;
            totalTime += leg.duration?.value || 0;
          });

          setDistanciaKm(Math.round((totalDist / 1000) * 10) / 10);
          setTiempoMin(Math.round(totalTime / 60));

          const waypointOrder = result.routes[0].waypoint_order || [];
          const rutaOptimizada =
            intermedios.length > 0
              ? reordenarRutaOptimizada(origen, destino, intermedios, waypointOrder)
              : [origen, destino];

          setRutaSeleccionada(rutaOptimizada);
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
  // CARGAR RUTA GUARDADA
  // ---------------------------------------------------------------------------
  const cargarRutaGuardada = (ruta: RutaGuardada) => {
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
    const intermedios = puntos.slice(1, -1);

    const waypoints = intermedios.map((p) => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true,
    }));

    service.route(
      {
        origin: { lat: origen.lat, lng: origen.lng },
        destination: { lat: destino.lat, lng: destino.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);

          const waypointOrder = result.routes[0].waypoint_order || [];
          const rutaOptimizada =
            intermedios.length > 0
              ? reordenarRutaOptimizada(origen, destino, intermedios, waypointOrder)
              : [origen, destino];

          setRutaSeleccionada(rutaOptimizada);

          let totalDist = 0;
          let totalTime = 0;

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

  // ---------------------------------------------------------------------------
  // NAVEGACIÓN EXTERNA
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
      <div className="w-[420px] overflow-y-auto border-r bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setVistaPanel('plan')}
            className={`rounded px-3 py-2 text-sm ${
              vistaPanel === 'plan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            Planeación
          </button>
          <button
            onClick={() => setVistaPanel('guardadas')}
            className={`rounded px-3 py-2 text-sm ${
              vistaPanel === 'guardadas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Rutas guardadas
          </button>
        </div>

        {vistaPanel === 'plan' && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Planeación de Ruta</h2>

            {rutaSeleccionada.length > 0 && (
              <div className="mb-4 rounded border bg-blue-50 p-3">
                <div className="text-sm font-semibold text-blue-700">
                  Ruta actual: {rutaSeleccionada.length} punto{rutaSeleccionada.length === 1 ? '' : 's'}
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  Al trazar la ruta, Google recomendará automáticamente el mejor orden.
                </div>
                <div className="mt-2 space-y-1">
                  {rutaSeleccionada.map((c, index) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span>
                        #{index + 1} {c.nombre}
                      </span>
                      <button
                        onClick={() => quitarClienteDeRuta(c.id)}
                        className="text-xs text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {DIAS_SEMANA.map((dia) => {
                const lista = clientesPorDia[dia] || [];
                if (!lista.length) return null;

                const esHoy = hoy === dia;

                return (
                  <div key={dia}>
                    <div
                      className={`mb-2 text-sm font-semibold ${
                        esHoy ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {esHoy ? `👉 ${dia} (HOY)` : dia}
                    </div>

                    <div className="space-y-2">
                      {lista.map((c) => {
                        const orden = ordenarRutaPorSeleccion(c.id);
                        const seleccionado = orden > 0;

                        return (
                          <div key={c.id} className="flex items-center gap-2 rounded border p-2">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleRuta(c)}
                            />
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

            <button
              onClick={trazarRuta}
              disabled={rutaSeleccionada.length < 2}
              className="mt-4 w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
            >
              Trazar Ruta Optimizada
            </button>

            <button
              onClick={guardarRuta}
              disabled={
                guardando ||
                rutaSeleccionada.length < 2 ||
                distanciaKm === null ||
                tiempoMin === null
              }
              className="mt-2 w-full rounded bg-green-600 py-2 text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar Ruta'}
            </button>

            <button
              onClick={limpiarRuta}
              className="mt-2 w-full rounded bg-gray-200 py-2 text-gray-800"
            >
              Limpiar Ruta
            </button>

            <button
              onClick={iniciarNavegacion}
              disabled={rutaSeleccionada.length < 2}
              className="mt-2 w-full rounded bg-emerald-500 py-2 text-white disabled:opacity-50"
            >
              Iniciar Navegación
            </button>

            {(distanciaKm !== null || tiempoMin !== null) && (
              <div className="mt-4 rounded border bg-gray-50 p-3 text-sm">
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

        {vistaPanel === 'guardadas' && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Rutas guardadas</h2>

            {rutasGuardadas.length === 0 ? (
              <div className="text-sm text-gray-500">No hay rutas guardadas</div>
            ) : (
              <div className="space-y-3">
                {rutasGuardadas.map((r) => (
                  <div key={r.id} className="rounded border p-3">
                    <div className="text-sm font-medium">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : 'Sin fecha'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {r.distanciaKm} km · {r.tiempoMin} min · {r.clientes?.length ?? 0} clientes
                    </div>

                    <button
                      onClick={() => cargarRutaGuardada(r)}
                      className="mt-2 w-full rounded bg-blue-600 py-2 text-white"
                    >
                      Cargar ruta
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setVistaPanel('plan')}
              className="mt-4 w-full rounded bg-gray-200 py-2 text-gray-800"
            >
              Volver a Planeación
            </button>
          </>
        )}
      </div>

      {/* MAPA */}
      <div className="flex-1">
        <div ref={mapDivRef} className="h-full w-full" />
      </div>
    </div>
  );
}