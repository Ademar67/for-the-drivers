"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  Search,
  Plus,
  Pencil,
  Trash2,
  HandCoins,
  Briefcase,
  Filter,
} from "lucide-react";

import { db } from "@/firebase/config";
import { Button } from "@/components/ui/button";

type EstatusAgencia =
  | "prospecto"
  | "contactada"
  | "negociacion"
  | "activa"
  | "inactiva";

type PotencialAgencia = "bajo" | "medio" | "alto";

type Agencia = {
  id: string;
  nombre: string;
  marca: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
  estatus: EstatusAgencia;
  potencial: PotencialAgencia;
  notas: string;
  createdAt?: any;
};

type FormData = {
  nombre: string;
  marca: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
  estatus: EstatusAgencia;
  potencial: PotencialAgencia;
  notas: string;
};

const initialForm: FormData = {
  nombre: "",
  marca: "",
  contacto: "",
  telefono: "",
  correo: "",
  ciudad: "",
  estatus: "prospecto",
  potencial: "medio",
  notas: "",
};

function badgeEstatus(estatus: EstatusAgencia) {
  switch (estatus) {
    case "activa":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "negociacion":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "contactada":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "inactiva":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-violet-100 text-violet-700 border-violet-200";
  }
}

function badgePotencial(potencial: PotencialAgencia) {
  switch (potencial) {
    case "alto":
      return "bg-red-100 text-red-700 border-red-200";
    case "medio":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AgenciasPage() {
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>(initialForm);

  const [search, setSearch] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<"todos" | EstatusAgencia>("todos");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FormData>(initialForm);

  useEffect(() => {
    const q = query(collection(db, "agencias"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data: Agencia[] = snapshot.docs.map((ds) => {
          const d: any = ds.data();

          return {
            id: ds.id,
            nombre: d.nombre ?? "",
            marca: d.marca ?? "",
            contacto: d.contacto ?? "",
            telefono: d.telefono ?? "",
            correo: d.correo ?? "",
            ciudad: d.ciudad ?? "",
            estatus: (d.estatus ?? "prospecto") as EstatusAgencia,
            potencial: (d.potencial ?? "medio") as PotencialAgencia,
            notas: d.notas ?? "",
            createdAt: d.createdAt,
          };
        });

        setAgencias(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando agencias:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const agenciasFiltradas = useMemo(() => {
    return agencias.filter((a) => {
      const matchesSearch =
        a.nombre.toLowerCase().includes(search.toLowerCase()) ||
        a.marca.toLowerCase().includes(search.toLowerCase()) ||
        a.contacto.toLowerCase().includes(search.toLowerCase()) ||
        a.ciudad.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterEstatus === "todos" ? true : a.estatus === filterEstatus;

      return matchesSearch && matchesStatus;
    });
  }, [agencias, search, filterEstatus]);

  const resumen = useMemo(() => {
    const activas = agencias.filter((a) => a.estatus === "activa").length;
    const prospecto = agencias.filter((a) => a.estatus === "prospecto").length;
    const negociacion = agencias.filter((a) => a.estatus === "negociacion").length;
    const altoPotencial = agencias.filter((a) => a.potencial === "alto").length;

    return {
      total: agencias.length,
      activas,
      prospecto,
      negociacion,
      altoPotencial,
    };
  }, [agencias]);

  const handleCreate = async () => {
    if (!form.nombre.trim()) {
      alert("El nombre de la agencia es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "agencias"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      setForm(initialForm);
      setOpenModal(false);
    } catch (error) {
      console.error("Error creando agencia:", error);
      alert("No se pudo crear la agencia.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (agencia: Agencia) => {
    setEditingId(agencia.id);
    setEditingForm({
      nombre: agencia.nombre,
      marca: agencia.marca,
      contacto: agencia.contacto,
      telefono: agencia.telefono,
      correo: agencia.correo,
      ciudad: agencia.ciudad,
      estatus: agencia.estatus,
      potencial: agencia.potencial,
      notas: agencia.notas,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "agencias", id), {
        ...editingForm,
      });

      setEditingId(null);
      setEditingForm(initialForm);
    } catch (error) {
      console.error("Error actualizando agencia:", error);
      alert("No se pudo actualizar la agencia.");
    }
  };

  const removeAgencia = async (id: string, nombre: string) => {
    const ok = window.confirm(`¿Seguro que quieres eliminar la agencia "${nombre}"?`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "agencias", id));
    } catch (error) {
      console.error("Error eliminando agencia:", error);
      alert("No se pudo eliminar la agencia.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Briefcase className="h-3.5 w-3.5" />
              Módulo Comercial
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Agencias PRO
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Gestiona agencias, detecta potencial comercial y construye una base
              sólida para propuestas, paquetes y simuladores de utilidad.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={() => setOpenModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva agencia
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Enfoque del módulo
            </p>
            <h2 className="mt-2 text-xl font-bold">Ventas por agencia</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Este módulo está pensado para ayudarte a detectar oportunidades,
              seguir negociaciones y luego conectar agencias con paquetes,
              márgenes y propuestas comerciales.
            </p>
          </div>
        </div>
      </section>

      {/* KPIS */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total agencias</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{resumen.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Activas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {resumen.activas}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">En negociación</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {resumen.negociacion}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Alto potencial</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {resumen.altoPotencial}
          </p>
        </div>
      </section>

      {/* FILTROS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, marca, contacto o ciudad..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-300"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterEstatus}
              onChange={(e) =>
                setFilterEstatus(e.target.value as "todos" | EstatusAgencia)
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-300"
            >
              <option value="todos">Todos los estatus</option>
              <option value="prospecto">Prospecto</option>
              <option value="contactada">Contactada</option>
              <option value="negociacion">Negociación</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>

          <Button onClick={() => setOpenModal(true)} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nueva
          </Button>
        </div>
      </section>

      {/* LISTADO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Agencias</h2>
          <p className="text-sm text-slate-500">
            Base comercial lista para crecer a simulador y propuesta.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Cargando agencias...
          </div>
        ) : agenciasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No hay agencias registradas todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {agenciasFiltradas.map((agencia) => {
              const isEditing = editingId === agencia.id;

              return (
                <div
                  key={agencia.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  {isEditing ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={editingForm.nombre}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                        placeholder="Nombre de agencia"
                        className="rounded-xl border px-3 py-2"
                      />
                      <input
                        value={editingForm.marca}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            marca: e.target.value,
                          }))
                        }
                        placeholder="Marca"
                        className="rounded-xl border px-3 py-2"
                      />
                      <input
                        value={editingForm.contacto}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            contacto: e.target.value,
                          }))
                        }
                        placeholder="Contacto"
                        className="rounded-xl border px-3 py-2"
                      />
                      <input
                        value={editingForm.telefono}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            telefono: e.target.value,
                          }))
                        }
                        placeholder="Teléfono"
                        className="rounded-xl border px-3 py-2"
                      />
                      <input
                        value={editingForm.correo}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            correo: e.target.value,
                          }))
                        }
                        placeholder="Correo"
                        className="rounded-xl border px-3 py-2"
                      />
                      <input
                        value={editingForm.ciudad}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            ciudad: e.target.value,
                          }))
                        }
                        placeholder="Ciudad"
                        className="rounded-xl border px-3 py-2"
                      />
                      <select
                        value={editingForm.estatus}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            estatus: e.target.value as EstatusAgencia,
                          }))
                        }
                        className="rounded-xl border px-3 py-2"
                      >
                        <option value="prospecto">Prospecto</option>
                        <option value="contactada">Contactada</option>
                        <option value="negociacion">Negociación</option>
                        <option value="activa">Activa</option>
                        <option value="inactiva">Inactiva</option>
                      </select>

                      <select
                        value={editingForm.potencial}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            potencial: e.target.value as PotencialAgencia,
                          }))
                        }
                        className="rounded-xl border px-3 py-2"
                      >
                        <option value="bajo">Potencial bajo</option>
                        <option value="medio">Potencial medio</option>
                        <option value="alto">Potencial alto</option>
                      </select>

                      <textarea
                        value={editingForm.notas}
                        onChange={(e) =>
                          setEditingForm((prev) => ({
                            ...prev,
                            notas: e.target.value,
                          }))
                        }
                        placeholder="Notas"
                        className="md:col-span-2 rounded-xl border px-3 py-2"
                        rows={3}
                      />

                      <div className="md:col-span-2 flex gap-2">
                        <Button onClick={() => saveEdit(agencia.id)}>Guardar</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm(initialForm);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {agencia.nombre || "Sin nombre"}
                          </h3>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeEstatus(
                              agencia.estatus
                            )}`}
                          >
                            {agencia.estatus}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgePotencial(
                              agencia.potencial
                            )}`}
                          >
                            Potencial {agencia.potencial}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {agencia.marca || "Sin marca"}
                        </p>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="h-4 w-4 text-slate-400" />
                            {agencia.contacto || "Sin contacto"}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {agencia.telefono || "Sin teléfono"}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {agencia.correo || "Sin correo"}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {agencia.ciudad || "Sin ciudad"}
                          </div>
                        </div>

                        {agencia.notas && (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                            {agencia.notas}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <HandCoins className="h-4 w-4" />
                          Enfoque comercial
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {agencia.potencial === "alto"
                            ? "Agencia prioritaria para presentar paquetes, propuesta y simulación de utilidad."
                            : agencia.potencial === "medio"
                            ? "Agencia con potencial para desarrollar con seguimiento y paquete inicial."
                            : "Agencia para exploración o mantenimiento comercial."}
                        </p>
                      </div>

                      <div className="flex flex-row gap-2 lg:flex-col">
                        <Button
                          variant="outline"
                          onClick={() => startEdit(agencia)}
                          className="rounded-xl"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => removeAgencia(agencia.id, agencia.nombre)}
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL NUEVA AGENCIA */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Nueva agencia
                </h3>
                <p className="text-sm text-slate-500">
                  Crea una base comercial lista para crecer.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre de agencia *"
                className="rounded-xl border px-3 py-2"
              />

              <input
                value={form.marca}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, marca: e.target.value }))
                }
                placeholder="Marca"
                className="rounded-xl border px-3 py-2"
              />

              <input
                value={form.contacto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contacto: e.target.value }))
                }
                placeholder="Contacto"
                className="rounded-xl border px-3 py-2"
              />

              <input
                value={form.telefono}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefono: e.target.value }))
                }
                placeholder="Teléfono"
                className="rounded-xl border px-3 py-2"
              />

              <input
                value={form.correo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, correo: e.target.value }))
                }
                placeholder="Correo"
                className="rounded-xl border px-3 py-2"
              />

              <input
                value={form.ciudad}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ciudad: e.target.value }))
                }
                placeholder="Ciudad"
                className="rounded-xl border px-3 py-2"
              />

              <select
                value={form.estatus}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estatus: e.target.value as EstatusAgencia,
                  }))
                }
                className="rounded-xl border px-3 py-2"
              >
                <option value="prospecto">Prospecto</option>
                <option value="contactada">Contactada</option>
                <option value="negociacion">Negociación</option>
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select>

              <select
                value={form.potencial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    potencial: e.target.value as PotencialAgencia,
                  }))
                }
                className="rounded-xl border px-3 py-2"
              >
                <option value="bajo">Potencial bajo</option>
                <option value="medio">Potencial medio</option>
                <option value="alto">Potencial alto</option>
              </select>

              <textarea
                value={form.notas}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notas: e.target.value }))
                }
                placeholder="Notas"
                className="md:col-span-2 rounded-xl border px-3 py-2"
                rows={4}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenModal(false);
                  setForm(initialForm);
                }}
              >
                Cancelar
              </Button>

              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Guardando..." : "Guardar agencia"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}