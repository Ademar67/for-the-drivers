"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";

type FlotillaEstado = "Prospecto" | "Seguimiento" | "Activo";

type Flotilla = {
  id?: string;
  empresa: string;
  contacto: string;
  unidades: number;
  estado: FlotillaEstado;
  createdAt?: unknown;
};

type Unidad = {
  eco: string;
  placas: string;
  tipo: string;
  km: string;
  aceite: string;
};

export default function FlotillasPage() {
  const [flotillas, setFlotillas] = useState<Flotilla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [empresaSeleccionada, setEmpresaSeleccionada] =
    useState<Flotilla | null>(null);

  const [nuevaFlotilla, setNuevaFlotilla] = useState<Flotilla>({
    empresa: "",
    contacto: "",
    unidades: 0,
    estado: "Prospecto",
  });

  const unidades: Unidad[] = [
    {
      eco: "TR-014",
      placas: "AB-123-CD",
      tipo: "Camioneta",
      km: "128,400",
      aceite: "Top Tec 4100 5W-40",
    },
    {
      eco: "TR-021",
      placas: "EF-456-GH",
      tipo: "Camión ligero",
      km: "210,800",
      aceite: "Molygen 5W-30",
    },
    {
      eco: "TR-031",
      placas: "IJ-789-KL",
      tipo: "Van",
      km: "86,200",
      aceite: "Leichtlauf 5W-40",
    },
  ];

  async function cargarFlotillas() {
    try {
      setCargando(true);

      const q = query(
        collection(db, "flotillas"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const data: Flotilla[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<Flotilla, "id">),
      }));

      setFlotillas(data);

      if (data.length > 0) {
        setEmpresaSeleccionada(data[0]);
      } else {
        setEmpresaSeleccionada(null);
      }
    } catch (error) {
      console.error("Error al cargar flotillas:", error);
      alert("No se pudieron cargar las flotillas.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarFlotillas();
  }, []);

  async function guardarFlotilla() {
    if (!nuevaFlotilla.empresa.trim() || !nuevaFlotilla.contacto.trim()) {
      alert("Completa empresa y contacto.");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        empresa: nuevaFlotilla.empresa.trim(),
        contacto: nuevaFlotilla.contacto.trim(),
        unidades: Number(nuevaFlotilla.unidades) || 0,
        estado: nuevaFlotilla.estado,
      };

      if (modoEdicion && editandoId) {
        await updateDoc(doc(db, "flotillas", editandoId), payload);

        const flotillaActualizada: Flotilla = {
          id: editandoId,
          ...payload,
        };

        setFlotillas((prev) =>
          prev.map((f) => (f.id === editandoId ? flotillaActualizada : f))
        );

        setEmpresaSeleccionada(flotillaActualizada);
        alert("Flotilla actualizada.");
      } else {
        const docRef = await addDoc(collection(db, "flotillas"), {
          ...payload,
          createdAt: serverTimestamp(),
        });

        const flotillaGuardada: Flotilla = {
          id: docRef.id,
          ...payload,
        };

        setFlotillas((prev) => [flotillaGuardada, ...prev]);
        setEmpresaSeleccionada(flotillaGuardada);
        alert("Flotilla guardada.");
      }

      setNuevaFlotilla({
        empresa: "",
        contacto: "",
        unidades: 0,
        estado: "Prospecto",
      });

      setMostrarFormulario(false);
      setModoEdicion(false);
      setEditandoId(null);
    } catch (error) {
      console.error("Error al guardar flotilla:", error);
      alert("No se pudo guardar la flotilla.");
    } finally {
      setGuardando(false);
    }
  }

  function editarFlotilla(flotilla: Flotilla) {
    setNuevaFlotilla({
      empresa: flotilla.empresa,
      contacto: flotilla.contacto,
      unidades: flotilla.unidades,
      estado: flotilla.estado,
    });

    setModoEdicion(true);
    setEditandoId(flotilla.id ?? null);
    setMostrarFormulario(true);
  }

  async function eliminarFlotilla(id: string) {
    const confirmar = confirm("¿Seguro que quieres eliminar esta flotilla?");
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "flotillas", id));

      const nuevasFlotillas = flotillas.filter((f) => f.id !== id);
      setFlotillas(nuevasFlotillas);

      if (empresaSeleccionada?.id === id) {
        setEmpresaSeleccionada(nuevasFlotillas[0] ?? null);
      }

      alert("Flotilla eliminada.");
    } catch (error) {
      console.error("Error al eliminar flotilla:", error);
      alert("No se pudo eliminar la flotilla.");
    }
  }

  function cancelarEdicion() {
    setModoEdicion(false);
    setEditandoId(null);
    setNuevaFlotilla({
      empresa: "",
      contacto: "",
      unidades: 0,
      estado: "Prospecto",
    });
    setMostrarFormulario(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Flotillas</h1>
          <p className="text-sm text-slate-500">
            Control comercial y técnico de clientes corporativos
          </p>
        </div>

        <button
          onClick={() => {
            if (mostrarFormulario && modoEdicion) {
              cancelarEdicion();
            } else {
              setMostrarFormulario((prev) => !prev);
            }
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {mostrarFormulario ? "Cerrar" : "+ Nueva flotilla"}
        </button>
      </div>

      {mostrarFormulario && (
        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            {modoEdicion ? "Editar flotilla" : "Agregar nueva flotilla"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Empresa</label>
              <input
                type="text"
                value={nuevaFlotilla.empresa}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    empresa: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Ej. Transportes del Bajío"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Contacto</label>
              <input
                type="text"
                value={nuevaFlotilla.contacto}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    contacto: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Unidades</label>
              <input
                type="number"
                value={nuevaFlotilla.unidades}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    unidades: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select
                value={nuevaFlotilla.estado}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    estado: e.target.value as FlotillaEstado,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
              >
                <option value="Prospecto">Prospecto</option>
                <option value="Seguimiento">Seguimiento</option>
                <option value="Activo">Activo</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={guardarFlotilla}
              disabled={guardando}
              className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : modoEdicion
                ? "Actualizar flotilla"
                : "Guardar flotilla"}
            </button>

            {modoEdicion && (
              <button
                onClick={cancelarEdicion}
                className="rounded-xl border px-4 py-2"
              >
                Cancelar
              </button>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Flotillas activas</p>
          <p className="text-2xl font-bold">
            {flotillas.filter((f) => f.estado === "Activo").length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Unidades</p>
          <p className="text-2xl font-bold">
            {flotillas.reduce((acc, item) => acc + item.unidades, 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Visitas</p>
          <p className="text-2xl font-bold">7</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Cotización abierta</p>
          <p className="text-2xl font-bold">$248k</p>
        </div>
      </div>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Empresas</h2>

        {cargando ? (
          <p className="text-sm text-slate-500">Cargando flotillas...</p>
        ) : flotillas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay flotillas guardadas.
          </p>
        ) : (
          <div className="space-y-3">
            {flotillas.map((f) => (
              <div
                key={f.id ?? f.empresa}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{f.empresa}</p>
                    <p className="text-sm text-slate-500">
                      Contacto: {f.contacto}
                    </p>
                  </div>

                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                    {f.estado}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm">
                    <strong>{f.unidades}</strong> unidades
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEmpresaSeleccionada(f)}
                      className="text-sm text-blue-600"
                    >
                      Ver detalle
                    </button>

                    <button
                      onClick={() => editarFlotilla(f)}
                      className="text-sm text-amber-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => f.id && eliminarFlotilla(f.id)}
                      className="text-sm text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex justify-between">
          <div>
            <h2 className="text-xl font-bold">Ficha de empresa</h2>
            <p className="text-sm text-slate-500">
              Vista ejemplo para control técnico
            </p>
          </div>

          {empresaSeleccionada && (
            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
              {empresaSeleccionada.estado}
            </span>
          )}
        </div>

        {empresaSeleccionada ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded bg-slate-50 p-3">
                Empresa: {empresaSeleccionada.empresa}
              </div>
              <div className="rounded bg-slate-50 p-3">
                Contacto: {empresaSeleccionada.contacto}
              </div>
              <div className="rounded bg-slate-50 p-3">
                Operativo: Marisol Vega
              </div>
              <div className="rounded bg-slate-50 p-3">
                Pago: Crédito 15 días
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 font-bold">Unidades</h3>

              {unidades.map((u) => (
                <div
                  key={u.eco}
                  className="mb-2 grid gap-2 rounded border p-3 md:grid-cols-5"
                >
                  <span>{u.eco}</span>
                  <span>{u.placas}</span>
                  <span>{u.tipo}</span>
                  <span>{u.km}</span>
                  <span>{u.aceite}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Selecciona una flotilla para ver su detalle.
          </p>
        )}
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">
          Oportunidades para vender más
        </h2>

        <div className="space-y-2 text-sm">
          <div className="rounded bg-yellow-100 p-3">
            6 unidades requieren servicio
          </div>
          <div className="rounded bg-blue-100 p-3">
            Oportunidad de convenio mensual
          </div>
          <div className="rounded bg-green-100 p-3">
            3 clientes sin recompra programada
          </div>
        </div>
      </section>
    </div>
  );
}

