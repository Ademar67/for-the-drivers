"use client";
import { ArrowLeft } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthProvider";

type FlotillaEstado = "Prospecto" | "Seguimiento" | "Activo";
type FiltroEstado = "Todos" | FlotillaEstado;

type Unidad = {
  eco: string;
  placas: string;
  tipo: string;
  km: string;
  aceite: string;
};

type Flotilla = {
  id?: string;
  ownerId?: string;
  ownerEmail?: string;
  empresa: string;
  contacto: string;
  operativo: string;
  pago: string;
  unidades: number;
  estado: FlotillaEstado;
  unidadesDetalle: Unidad[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

const unidadVacia: Unidad = {
  eco: "",
  placas: "",
  tipo: "",
  km: "",
  aceite: "",
};

function obtenerClasesEstado(estado: FlotillaEstado) {
  switch (estado) {
    case "Activo":
      return "bg-green-100 text-green-700";
    case "Seguimiento":
      return "bg-amber-100 text-amber-700";
    case "Prospecto":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function obtenerPrioridadEstado(estado: FlotillaEstado) {
  switch (estado) {
    case "Activo":
      return 0;
    case "Seguimiento":
      return 1;
    case "Prospecto":
    default:
      return 2;
  }
}

export default function FlotillasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [flotillas, setFlotillas] = useState<Flotilla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoUnidad, setGuardandoUnidad] = useState(false);
  const [agregandoUnidadGuardada, setAgregandoUnidadGuardada] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [empresaSeleccionada, setEmpresaSeleccionada] =
    useState<Flotilla | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");

  const [nuevaFlotilla, setNuevaFlotilla] = useState<Flotilla>({
    empresa: "",
    contacto: "",
    operativo: "",
    pago: "",
    unidades: 0,
    estado: "Prospecto",
    unidadesDetalle: [],
  });

  const [nuevaUnidad, setNuevaUnidad] = useState<Unidad>(unidadVacia);
  const [nuevaUnidadGuardada, setNuevaUnidadGuardada] =
    useState<Unidad>(unidadVacia);

  const [indiceUnidadEditandoFormulario, setIndiceUnidadEditandoFormulario] =
    useState<number | null>(null);
  const [unidadEditandoFormulario, setUnidadEditandoFormulario] =
    useState<Unidad>(unidadVacia);

  const [indiceUnidadEditandoGuardada, setIndiceUnidadEditandoGuardada] =
    useState<number | null>(null);
  const [unidadEditandoGuardada, setUnidadEditandoGuardada] =
    useState<Unidad>(unidadVacia);

  async function cargarFlotillas() {
    if (!user) {
      setFlotillas([]);
      setEmpresaSeleccionada(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);

      const q = query(
        collection(db, "flotillas"),
        where("ownerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const data: Flotilla[] = snapshot.docs.map((docItem) => {
        const raw = docItem.data() as Partial<Flotilla>;

        return {
          id: docItem.id,
          ownerId: raw.ownerId ?? "",
          ownerEmail: raw.ownerEmail ?? "",
          empresa: raw.empresa ?? "",
          contacto: raw.contacto ?? "",
          operativo: raw.operativo ?? "",
          pago: raw.pago ?? "",
          unidades: Number(raw.unidades ?? 0),
          estado: (raw.estado ?? "Prospecto") as FlotillaEstado,
          unidadesDetalle: raw.unidadesDetalle ?? [],
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };
      });

      data.sort((a, b) => {
        const aTime =
          typeof (a.createdAt as any)?.toMillis === "function"
            ? (a.createdAt as any).toMillis()
            : 0;
        const bTime =
          typeof (b.createdAt as any)?.toMillis === "function"
            ? (b.createdAt as any).toMillis()
            : 0;

        return bTime - aTime;
      });

      setFlotillas(data);

      if (data.length > 0) {
        setEmpresaSeleccionada((prev) => {
          if (!prev?.id) return data[0];
          return data.find((f) => f.id === prev.id) ?? data[0];
        });
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
    if (authLoading) return;
    cargarFlotillas();
  }, [user, authLoading]);

  const flotillasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return [...flotillas]
      .filter((f) => {
        const coincideBusqueda =
          termino === "" ||
          f.empresa.toLowerCase().includes(termino) ||
          f.contacto.toLowerCase().includes(termino);

        const coincideEstado =
          filtroEstado === "Todos" || f.estado === filtroEstado;

        return coincideBusqueda && coincideEstado;
      })
      .sort((a, b) => {
        const prioridadA = obtenerPrioridadEstado(a.estado);
        const prioridadB = obtenerPrioridadEstado(b.estado);

        if (prioridadA !== prioridadB) {
          return prioridadA - prioridadB;
        }

        return a.empresa.localeCompare(b.empresa, "es", {
          sensitivity: "base",
        });
      });
  }, [flotillas, busqueda, filtroEstado]);

  const totalActivas = useMemo(() => {
    return flotillasFiltradas.filter((f) => f.estado === "Activo").length;
  }, [flotillasFiltradas]);

  const totalSeguimiento = useMemo(() => {
    return flotillasFiltradas.filter((f) => f.estado === "Seguimiento").length;
  }, [flotillasFiltradas]);

  const totalProspectos = useMemo(() => {
    return flotillasFiltradas.filter((f) => f.estado === "Prospecto").length;
  }, [flotillasFiltradas]);

  const totalUnidades = useMemo(() => {
    return flotillasFiltradas.reduce((acc, item) => acc + item.unidades, 0);
  }, [flotillasFiltradas]);

  function limpiarFormularioFlotilla() {
    setNuevaFlotilla({
      empresa: "",
      contacto: "",
      operativo: "",
      pago: "",
      unidades: 0,
      estado: "Prospecto",
      unidadesDetalle: [],
    });
    setNuevaUnidad(unidadVacia);
    cancelarEdicionUnidadFormulario();
  }

  function validarUnidad(unidad: Unidad) {
    return (
      unidad.eco.trim() !== "" &&
      unidad.placas.trim() !== "" &&
      unidad.tipo.trim() !== ""
    );
  }

  function agregarUnidadAlFormulario() {
    if (!validarUnidad(nuevaUnidad)) {
      alert("Completa al menos económico, placas y tipo.");
      return;
    }

    const unidadParaAgregar: Unidad = {
      eco: nuevaUnidad.eco.trim(),
      placas: nuevaUnidad.placas.trim(),
      tipo: nuevaUnidad.tipo.trim(),
      km: nuevaUnidad.km.trim(),
      aceite: nuevaUnidad.aceite.trim(),
    };

    setNuevaFlotilla((prev) => {
      const nuevasUnidades = [...(prev.unidadesDetalle ?? []), unidadParaAgregar];
      return {
        ...prev,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };
    });

    setNuevaUnidad(unidadVacia);
  }

  function eliminarUnidadDelFormulario(index: number) {
    setNuevaFlotilla((prev) => {
      const nuevasUnidades = (prev.unidadesDetalle ?? []).filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };
    });

    if (indiceUnidadEditandoFormulario === index) {
      cancelarEdicionUnidadFormulario();
    }
  }

  function iniciarEdicionUnidadFormulario(index: number) {
    const unidad = nuevaFlotilla.unidadesDetalle?.[index];
    if (!unidad) return;

    setIndiceUnidadEditandoFormulario(index);
    setUnidadEditandoFormulario({ ...unidad });
  }

  function cancelarEdicionUnidadFormulario() {
    setIndiceUnidadEditandoFormulario(null);
    setUnidadEditandoFormulario(unidadVacia);
  }

  function guardarEdicionUnidadFormulario() {
    if (indiceUnidadEditandoFormulario === null) return;

    if (!validarUnidad(unidadEditandoFormulario)) {
      alert("Completa al menos económico, placas y tipo.");
      return;
    }

    const unidadActualizada: Unidad = {
      eco: unidadEditandoFormulario.eco.trim(),
      placas: unidadEditandoFormulario.placas.trim(),
      tipo: unidadEditandoFormulario.tipo.trim(),
      km: unidadEditandoFormulario.km.trim(),
      aceite: unidadEditandoFormulario.aceite.trim(),
    };

    setNuevaFlotilla((prev) => {
      const nuevasUnidades = [...(prev.unidadesDetalle ?? [])];
      nuevasUnidades[indiceUnidadEditandoFormulario] = unidadActualizada;

      return {
        ...prev,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };
    });

    cancelarEdicionUnidadFormulario();
  }

  async function guardarFlotilla() {
    if (!user) {
      alert("Debes iniciar sesión para guardar flotillas.");
      return;
    }

    if (!nuevaFlotilla.empresa.trim() || !nuevaFlotilla.contacto.trim()) {
      alert("Completa empresa y contacto.");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        empresa: nuevaFlotilla.empresa.trim(),
        contacto: nuevaFlotilla.contacto.trim(),
        operativo: nuevaFlotilla.operativo.trim(),
        pago: nuevaFlotilla.pago.trim(),
        unidades: (nuevaFlotilla.unidadesDetalle ?? []).length,
        estado: nuevaFlotilla.estado,
        unidadesDetalle: nuevaFlotilla.unidadesDetalle ?? [],
        updatedAt: serverTimestamp(),
      };

      if (modoEdicion && editandoId) {
        await updateDoc(doc(db, "flotillas", editandoId), payload);

        const flotillaActualizada: Flotilla = {
          id: editandoId,
          ...payload,
          createdAt:
            flotillas.find((f) => f.id === editandoId)?.createdAt ?? undefined,
        };

        setFlotillas((prev) =>
          prev.map((f) => (f.id === editandoId ? flotillaActualizada : f))
        );

        setEmpresaSeleccionada((prev) =>
          prev?.id === editandoId ? flotillaActualizada : prev
        );

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

      limpiarFormularioFlotilla();
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
      empresa: flotilla.empresa ?? "",
      contacto: flotilla.contacto ?? "",
      operativo: flotilla.operativo ?? "",
      pago: flotilla.pago ?? "",
      unidades: flotilla.unidades ?? 0,
      estado: flotilla.estado ?? "Prospecto",
      unidadesDetalle: flotilla.unidadesDetalle ?? [],
      ownerId: flotilla.ownerId,
      ownerEmail: flotilla.ownerEmail,
    });

    setNuevaUnidad(unidadVacia);
    cancelarEdicionUnidadFormulario();
    setModoEdicion(true);
    setEditandoId(flotilla.id ?? null);
    setMostrarFormulario(true);
  }

  async function eliminarFlotilla(id: string) {
    if (!user) {
      alert("Debes iniciar sesión para eliminar flotillas.");
      return;
    }

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
    limpiarFormularioFlotilla();
    setMostrarFormulario(false);
  }

  async function eliminarUnidadGuardada(index: number) {
    if (!user || !empresaSeleccionada?.id) return;

    const confirmar = confirm("¿Eliminar esta unidad?");
    if (!confirmar) return;

    try {
      const nuevasUnidades = (empresaSeleccionada.unidadesDetalle ?? []).filter(
        (_, i) => i !== index
      );

      const flotillaActualizada: Flotilla = {
        ...empresaSeleccionada,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };

      await updateDoc(doc(db, "flotillas", empresaSeleccionada.id), {
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
        updatedAt: serverTimestamp(),
      });

      setEmpresaSeleccionada(flotillaActualizada);
      setFlotillas((prev) =>
        prev.map((f) =>
          f.id === empresaSeleccionada.id ? flotillaActualizada : f
        )
      );

      if (indiceUnidadEditandoGuardada === index) {
        cancelarEdicionUnidadGuardada();
      }

      alert("Unidad eliminada.");
    } catch (error) {
      console.error("Error al eliminar unidad:", error);
      alert("No se pudo eliminar la unidad.");
    }
  }

  function iniciarEdicionUnidadGuardada(index: number) {
    const unidad = empresaSeleccionada?.unidadesDetalle?.[index];
    if (!unidad) return;

    setIndiceUnidadEditandoGuardada(index);
    setUnidadEditandoGuardada({ ...unidad });
  }

  function cancelarEdicionUnidadGuardada() {
    setIndiceUnidadEditandoGuardada(null);
    setUnidadEditandoGuardada(unidadVacia);
  }

  async function guardarEdicionUnidadGuardada() {
    if (!user || !empresaSeleccionada?.id || indiceUnidadEditandoGuardada === null) {
      return;
    }

    if (!validarUnidad(unidadEditandoGuardada)) {
      alert("Completa al menos económico, placas y tipo.");
      return;
    }

    try {
      setGuardandoUnidad(true);

      const unidadActualizada: Unidad = {
        eco: unidadEditandoGuardada.eco.trim(),
        placas: unidadEditandoGuardada.placas.trim(),
        tipo: unidadEditandoGuardada.tipo.trim(),
        km: unidadEditandoGuardada.km.trim(),
        aceite: unidadEditandoGuardada.aceite.trim(),
      };

      const nuevasUnidades = [...(empresaSeleccionada.unidadesDetalle ?? [])];
      nuevasUnidades[indiceUnidadEditandoGuardada] = unidadActualizada;

      const flotillaActualizada: Flotilla = {
        ...empresaSeleccionada,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };

      await updateDoc(doc(db, "flotillas", empresaSeleccionada.id), {
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
        updatedAt: serverTimestamp(),
      });

      setEmpresaSeleccionada(flotillaActualizada);
      setFlotillas((prev) =>
        prev.map((f) =>
          f.id === empresaSeleccionada.id ? flotillaActualizada : f
        )
      );

      cancelarEdicionUnidadGuardada();
      alert("Unidad actualizada.");
    } catch (error) {
      console.error("Error al actualizar unidad:", error);
      alert("No se pudo actualizar la unidad.");
    } finally {
      setGuardandoUnidad(false);
    }
  }

  async function agregarUnidadAFichaEmpresa() {
    if (!user || !empresaSeleccionada?.id) return;

    if (!validarUnidad(nuevaUnidadGuardada)) {
      alert("Completa al menos económico, placas y tipo.");
      return;
    }

    try {
      setAgregandoUnidadGuardada(true);

      const unidadParaAgregar: Unidad = {
        eco: nuevaUnidadGuardada.eco.trim(),
        placas: nuevaUnidadGuardada.placas.trim(),
        tipo: nuevaUnidadGuardada.tipo.trim(),
        km: nuevaUnidadGuardada.km.trim(),
        aceite: nuevaUnidadGuardada.aceite.trim(),
      };

      const nuevasUnidades = [
        ...(empresaSeleccionada.unidadesDetalle ?? []),
        unidadParaAgregar,
      ];

      const flotillaActualizada: Flotilla = {
        ...empresaSeleccionada,
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
      };

      await updateDoc(doc(db, "flotillas", empresaSeleccionada.id), {
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        unidadesDetalle: nuevasUnidades,
        unidades: nuevasUnidades.length,
        updatedAt: serverTimestamp(),
      });

      setEmpresaSeleccionada(flotillaActualizada);
      setFlotillas((prev) =>
        prev.map((f) =>
          f.id === empresaSeleccionada.id ? flotillaActualizada : f
        )
      );

      setNuevaUnidadGuardada(unidadVacia);
      alert("Unidad agregada.");
    } catch (error) {
      console.error("Error al agregar unidad:", error);
      alert("No se pudo agregar la unidad.");
    } finally {
      setAgregandoUnidadGuardada(false);
    }
  }

  if (authLoading) {
    return <div className="space-y-6">Cargando flotillas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
                <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
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
              <label className="mb-1 block text-sm font-medium">Operativo</label>
              <input
                type="text"
                value={nuevaFlotilla.operativo}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    operativo: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Ej. Marisol Vega"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Condición de pago
              </label>
              <input
                type="text"
                value={nuevaFlotilla.pago}
                onChange={(e) =>
                  setNuevaFlotilla((prev) => ({
                    ...prev,
                    pago: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Ej. Crédito 15 días"
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

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <h3 className="mb-4 text-lg font-bold">Agregar unidad</h3>

            <div className="grid gap-4 md:grid-cols-5">
              <input
                type="text"
                value={nuevaUnidad.eco}
                onChange={(e) =>
                  setNuevaUnidad((prev) => ({ ...prev, eco: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Económico"
              />
              <input
                type="text"
                value={nuevaUnidad.placas}
                onChange={(e) =>
                  setNuevaUnidad((prev) => ({
                    ...prev,
                    placas: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Placas"
              />
              <input
                type="text"
                value={nuevaUnidad.tipo}
                onChange={(e) =>
                  setNuevaUnidad((prev) => ({ ...prev, tipo: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Tipo"
              />
              <input
                type="text"
                value={nuevaUnidad.km}
                onChange={(e) =>
                  setNuevaUnidad((prev) => ({ ...prev, km: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Kilometraje"
              />
              <input
                type="text"
                value={nuevaUnidad.aceite}
                onChange={(e) =>
                  setNuevaUnidad((prev) => ({
                    ...prev,
                    aceite: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Aceite"
              />
            </div>

            <div className="mt-4">
              <button
                onClick={agregarUnidadAlFormulario}
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
              >
                Agregar unidad
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {(nuevaFlotilla.unidadesDetalle ?? []).length > 0 ? (
                nuevaFlotilla.unidadesDetalle.map((u, index) => {
                  const estaEditando = indiceUnidadEditandoFormulario === index;

                  return (
                    <div
                      key={`${u.eco}-${index}`}
                      className="rounded border p-3"
                    >
                      {estaEditando ? (
                        <>
                          <div className="grid gap-2 md:grid-cols-5">
                            <input
                              type="text"
                              value={unidadEditandoFormulario.eco}
                              onChange={(e) =>
                                setUnidadEditandoFormulario((prev) => ({
                                  ...prev,
                                  eco: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Económico"
                            />
                            <input
                              type="text"
                              value={unidadEditandoFormulario.placas}
                              onChange={(e) =>
                                setUnidadEditandoFormulario((prev) => ({
                                  ...prev,
                                  placas: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Placas"
                            />
                            <input
                              type="text"
                              value={unidadEditandoFormulario.tipo}
                              onChange={(e) =>
                                setUnidadEditandoFormulario((prev) => ({
                                  ...prev,
                                  tipo: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Tipo"
                            />
                            <input
                              type="text"
                              value={unidadEditandoFormulario.km}
                              onChange={(e) =>
                                setUnidadEditandoFormulario((prev) => ({
                                  ...prev,
                                  km: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Kilometraje"
                            />
                            <input
                              type="text"
                              value={unidadEditandoFormulario.aceite}
                              onChange={(e) =>
                                setUnidadEditandoFormulario((prev) => ({
                                  ...prev,
                                  aceite: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Aceite"
                            />
                          </div>

                          <div className="mt-3 flex gap-3">
                            <button
                              type="button"
                              onClick={guardarEdicionUnidadFormulario}
                              className="text-sm text-green-600"
                            >
                              Guardar cambios
                            </button>
                            <button
                              type="button"
                              onClick={cancelarEdicionUnidadFormulario}
                              className="text-sm text-slate-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-7">
                          <span>{u.eco}</span>
                          <span>{u.placas}</span>
                          <span>{u.tipo}</span>
                          <span>{u.km}</span>
                          <span>{u.aceite}</span>
                          <button
                            type="button"
                            onClick={() => iniciarEdicionUnidadFormulario(index)}
                            className="text-sm text-amber-600"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarUnidadDelFormulario(index)}
                            className="text-sm text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  Aún no agregas unidades a esta flotilla.
                </p>
              )}
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
          <p className="text-sm text-slate-500">Activos</p>
          <p className="text-2xl font-bold">{totalActivas}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Seguimiento</p>
          <p className="text-2xl font-bold">{totalSeguimiento}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Prospectos</p>
          <p className="text-2xl font-bold">{totalProspectos}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Unidades</p>
          <p className="text-2xl font-bold">{totalUnidades}</p>
        </div>
      </div>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Empresas</h2>
            <p className="text-sm text-slate-500">
              Busca por empresa o contacto y filtra por estado
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                placeholder="Empresa o contacto"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value as FiltroEstado)
                }
                className="w-full rounded-xl border px-3 py-2 outline-none"
              >
                <option value="Todos">Todos</option>
                <option value="Prospecto">Prospecto</option>
                <option value="Seguimiento">Seguimiento</option>
                <option value="Activo">Activo</option>
              </select>
            </div>
          </div>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500">Cargando flotillas...</p>
        ) : flotillasFiltradas.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay resultados con esos filtros.
          </p>
        ) : (
          <div className="space-y-3">
            {flotillasFiltradas.map((f) => (
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

                  <span
                    className={`rounded px-2 py-1 text-xs ${obtenerClasesEstado(
                      f.estado
                    )}`}
                  >
                    {f.estado}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm">
                    <strong>{f.unidades}</strong> unidades
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEmpresaSeleccionada(f);
                        cancelarEdicionUnidadGuardada();
                        setNuevaUnidadGuardada(unidadVacia);
                      }}
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
              Detalle comercial y técnico de la flotilla seleccionada
            </p>
          </div>

          {empresaSeleccionada && (
            <span
              className={`rounded px-2 py-1 text-xs ${obtenerClasesEstado(
                empresaSeleccionada.estado
              )}`}
            >
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
                Operativo: {empresaSeleccionada.operativo || "Sin dato"}
              </div>
              <div className="rounded bg-slate-50 p-3">
                Pago: {empresaSeleccionada.pago || "Sin dato"}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-4 text-lg font-bold">
                Agregar unidad a la empresa
              </h3>

              <div className="grid gap-4 md:grid-cols-5">
                <input
                  type="text"
                  value={nuevaUnidadGuardada.eco}
                  onChange={(e) =>
                    setNuevaUnidadGuardada((prev) => ({
                      ...prev,
                      eco: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  placeholder="Económico"
                />
                <input
                  type="text"
                  value={nuevaUnidadGuardada.placas}
                  onChange={(e) =>
                    setNuevaUnidadGuardada((prev) => ({
                      ...prev,
                      placas: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  placeholder="Placas"
                />
                <input
                  type="text"
                  value={nuevaUnidadGuardada.tipo}
                  onChange={(e) =>
                    setNuevaUnidadGuardada((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  placeholder="Tipo"
                />
                <input
                  type="text"
                  value={nuevaUnidadGuardada.km}
                  onChange={(e) =>
                    setNuevaUnidadGuardada((prev) => ({
                      ...prev,
                      km: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  placeholder="Kilometraje"
                />
                <input
                  type="text"
                  value={nuevaUnidadGuardada.aceite}
                  onChange={(e) =>
                    setNuevaUnidadGuardada((prev) => ({
                      ...prev,
                      aceite: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none"
                  placeholder="Aceite"
                />
              </div>

              <div className="mt-4">
                <button
                  onClick={agregarUnidadAFichaEmpresa}
                  disabled={agregandoUnidadGuardada}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {agregandoUnidadGuardada
                    ? "Agregando..."
                    : "Agregar unidad a esta empresa"}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 font-bold">Unidades</h3>

              {(empresaSeleccionada.unidadesDetalle ?? []).length > 0 ? (
                empresaSeleccionada.unidadesDetalle.map((u, index) => {
                  const estaEditando = indiceUnidadEditandoGuardada === index;

                  return (
                    <div
                      key={`${u.eco}-${index}`}
                      className="mb-2 rounded border p-3"
                    >
                      {estaEditando ? (
                        <>
                          <div className="grid gap-2 md:grid-cols-5">
                            <input
                              type="text"
                              value={unidadEditandoGuardada.eco}
                              onChange={(e) =>
                                setUnidadEditandoGuardada((prev) => ({
                                  ...prev,
                                  eco: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Económico"
                            />
                            <input
                              type="text"
                              value={unidadEditandoGuardada.placas}
                              onChange={(e) =>
                                setUnidadEditandoGuardada((prev) => ({
                                  ...prev,
                                  placas: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Placas"
                            />
                            <input
                              type="text"
                              value={unidadEditandoGuardada.tipo}
                              onChange={(e) =>
                                setUnidadEditandoGuardada((prev) => ({
                                  ...prev,
                                  tipo: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Tipo"
                            />
                            <input
                              type="text"
                              value={unidadEditandoGuardada.km}
                              onChange={(e) =>
                                setUnidadEditandoGuardada((prev) => ({
                                  ...prev,
                                  km: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Kilometraje"
                            />
                            <input
                              type="text"
                              value={unidadEditandoGuardada.aceite}
                              onChange={(e) =>
                                setUnidadEditandoGuardada((prev) => ({
                                  ...prev,
                                  aceite: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border px-3 py-2 outline-none"
                              placeholder="Aceite"
                            />
                          </div>

                          <div className="mt-3 flex gap-3">
                            <button
                              onClick={guardarEdicionUnidadGuardada}
                              disabled={guardandoUnidad}
                              className="text-sm text-green-600 disabled:opacity-60"
                            >
                              {guardandoUnidad ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button
                              onClick={cancelarEdicionUnidadGuardada}
                              disabled={guardandoUnidad}
                              className="text-sm text-slate-600 disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-7">
                          <span>{u.eco}</span>
                          <span>{u.placas}</span>
                          <span>{u.tipo}</span>
                          <span>{u.km}</span>
                          <span>{u.aceite}</span>
                          <button
                            onClick={() => iniciarEdicionUnidadGuardada(index)}
                            className="text-sm text-amber-600"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarUnidadGuardada(index)}
                            className="text-sm text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  No hay unidades registradas.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Selecciona una flotilla para ver su detalle.
          </p>
        )}
      </section>
    </div>
  );
}