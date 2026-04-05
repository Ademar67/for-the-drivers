"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
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
  Calculator,
  Package2,
  X,
  ShoppingCart,
  Layers3,
  FileDown,
  MessageCircle,
} from "lucide-react";

import { db } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import {
  compartirComboPdf,
  descargarComboPDF,
  type ComboPdfData,
} from 
"@/lib/pdf/generarComboPDF";

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

type PaqueteSimulador = {
  nombre: string;
  costoAgencia: number;
  precioConsumidor: number;
};

type ItemCotizador = {
  nombre: string;
  cantidad: number;
};

const COMISION_ASESOR_POR_PAQUETE = 50;

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

const paquetesBase: PaqueteSimulador[] = [
  {
    nombre: "Complemento de mantenimiento",
    costoAgencia: 547.7,
    precioConsumidor: 1045.4,
  },
  {
    nombre: "Paquete premium",
    costoAgencia: 761.9,
    precioConsumidor: 1473.8,
  },
  {
    nombre: "Limpieza correctiva de inyectores",
    costoAgencia: 2162.6,
    precioConsumidor: 4275.2,
  },
  {
    nombre: "Protección para motor",
    costoAgencia: 1150.4,
    precioConsumidor: 2250.8,
  },
  {
    nombre: "Limpieza del sistema del aire acondicionado",
    costoAgencia: 657.95,
    precioConsumidor: 1265.9,
  },
  {
    nombre: "Paquete servicio sistema de refrigeración",
    costoAgencia: 364.4,
    precioConsumidor: 678.81,
  },
  {
    nombre: "Limpieza preventiva de inyectores a diesel",
    costoAgencia: 642.2,
    precioConsumidor: 1234.4,
  },
  {
    nombre: "Restauración de plásticos y gomas",
    costoAgencia: 353.45,
    precioConsumidor: 619.1,
  },
  {
    nombre: "Potencia motor",
    costoAgencia: 563.45,
    precioConsumidor: 1076.9,
  },
  {
    nombre: "Paquete frenos",
    costoAgencia: 319.85,
    precioConsumidor: 589.7,
  },
  {
    nombre: "Limpieza cuerpo de aceleración",
    costoAgencia: 374.45,
    precioConsumidor: 698.9,
  },
];

const combosSugeridos: { nombre: string; paquetes: string[] }[] = [
  {
    nombre: "Combo básico",
    paquetes: ["Complemento de mantenimiento", "Limpieza cuerpo de aceleración"],
  },
  {
    nombre: "Combo preventivo",
    paquetes: [
      "Complemento de mantenimiento",
      "Limpieza del sistema del aire acondicionado",
      "Paquete servicio sistema de refrigeración",
    ],
  },
  {
    nombre: "Combo potencia",
    paquetes: ["Potencia motor", "Protección para motor", "Paquete premium"],
  },
  {
    nombre: "Combo diesel",
    paquetes: ["Limpieza preventiva de inyectores a diesel", "Protección para motor"],
  },
  {
    nombre: "Combo taller",
    paquetes: [
      "Paquete frenos",
      "Limpieza cuerpo de aceleración",
      "Restauración de plásticos y gomas",
    ],
  },
];

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

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

  const [paqueteParaAgregar, setPaqueteParaAgregar] = useState<string>(
    paquetesBase[0].nombre
  );
  const [itemsCotizador, setItemsCotizador] = useState<ItemCotizador[]>([
    { nombre: "Paquete premium", cantidad: 1 },
  ]);
  const [ventasMes, setVentasMes] = useState<number>(8);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [whatsLoading, setWhatsLoading] = useState(false);

  useEffect(() => {
    const agenciasRef = collection(db, "agencias");

    const unsub = onSnapshot(
      agenciasRef,
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

        data.sort((a, b) => {
          const aTime =
            typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
          const bTime =
            typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;

          return bTime - aTime;
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
      const term = search.toLowerCase();

      const matchesSearch =
        a.nombre.toLowerCase().includes(term) ||
        a.marca.toLowerCase().includes(term) ||
        a.contacto.toLowerCase().includes(term) ||
        a.ciudad.toLowerCase().includes(term);

      const matchesStatus = filterEstatus === "todos" ? true : a.estatus === filterEstatus;

      return matchesSearch && matchesStatus;
    });
  }, [agencias, search, filterEstatus]);

  const resumen = useMemo(() => {
    const activas = agencias.filter((a) => a.estatus === "activa").length;
    const negociacion = agencias.filter((a) => a.estatus === "negociacion").length;
    const altoPotencial = agencias.filter((a) => a.potencial === "alto").length;

    return {
      total: agencias.length,
      activas,
      negociacion,
      altoPotencial,
    };
  }, [agencias]);

  const paquetesMap = useMemo(() => {
    return new Map(paquetesBase.map((p) => [p.nombre, p]));
  }, []);

  const detalleCombo = useMemo(() => {
    return itemsCotizador
      .map((item) => {
        const paquete = paquetesMap.get(item.nombre);
        if (!paquete) return null;

        const subtotalCosto = paquete.costoAgencia * item.cantidad;
        const subtotalPrecio = paquete.precioConsumidor * item.cantidad;
        const subtotalUtilidad = subtotalPrecio - subtotalCosto;
        const subtotalComision = COMISION_ASESOR_POR_PAQUETE * item.cantidad;
        const subtotalUtilidadNeta = subtotalUtilidad - subtotalComision;

        return {
          ...item,
          paquete,
          subtotalCosto,
          subtotalPrecio,
          subtotalUtilidad,
          subtotalComision,
          subtotalUtilidadNeta,
        };
      })
      .filter(Boolean) as Array<{
      nombre: string;
      cantidad: number;
      paquete: PaqueteSimulador;
      subtotalCosto: number;
      subtotalPrecio: number;
      subtotalUtilidad: number;
      subtotalComision: number;
      subtotalUtilidadNeta: number;
    }>;
  }, [itemsCotizador, paquetesMap]);

  const simulacion = useMemo(() => {
    const costoTotal = detalleCombo.reduce((acc, item) => acc + item.subtotalCosto, 0);
    const precioTotal = detalleCombo.reduce((acc, item) => acc + item.subtotalPrecio, 0);
    const utilidadTotal = detalleCombo.reduce((acc, item) => acc + item.subtotalUtilidad, 0);
    const comisionTotalCombo = detalleCombo.reduce(
      (acc, item) => acc + item.subtotalComision,
      0
    );
    const utilidadNetaCombo = detalleCombo.reduce(
      (acc, item) => acc + item.subtotalUtilidadNeta,
      0
    );
    const piezasTotalesCombo = detalleCombo.reduce((acc, item) => acc + item.cantidad, 0);

    const utilidadMensualAgencia = utilidadNetaCombo * ventasMes;
    const comisionMensualAsesor = comisionTotalCombo * ventasMes;
    const ticketPromedio = precioTotal;
    const margenBrutoPct = precioTotal > 0 ? (utilidadTotal / precioTotal) * 100 : 0;

    return {
      costoTotal,
      precioTotal,
      utilidadTotal,
      comisionTotalCombo,
      utilidadNetaCombo,
      piezasTotalesCombo,
      ventasMes,
      utilidadMensualAgencia,
      comisionMensualAsesor,
      ticketPromedio,
      margenBrutoPct,
    };
  }, [detalleCombo, ventasMes]);

  const comboNombreActual = useMemo(() => {
    if (detalleCombo.length === 0) return "Combo comercial";
    if (detalleCombo.length === 1) return detalleCombo[0].nombre;
    return `Combo de ${detalleCombo.length} paquetes`;
  }, [detalleCombo]);

  const buildComboPdfData = (): ComboPdfData => {
    return {
      agenciaNombre: "Agencia objetivo",
      comboNombre: comboNombreActual,
      ventasMes: simulacion.ventasMes,
      piezasTotalesCombo: simulacion.piezasTotalesCombo,
      costoTotal: simulacion.costoTotal,
      precioTotal: simulacion.precioTotal,
      utilidadTotal: simulacion.utilidadTotal,
      utilidadNetaCombo: simulacion.utilidadNetaCombo,
      comisionTotalCombo: simulacion.comisionTotalCombo,
      utilidadMensualAgencia: simulacion.utilidadMensualAgencia,
      comisionMensualAsesor: simulacion.comisionMensualAsesor,
      ticketPromedio: simulacion.ticketPromedio,
      margenBrutoPct: simulacion.margenBrutoPct,
      observaciones:
        "Propuesta comercial orientada a subir ticket promedio, defender utilidad y facilitar el cierre con una oferta más clara para la agencia.",
      generatedAt: new Date(),
      items: detalleCombo.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        costoUnitario: item.paquete.costoAgencia,
        precioUnitario: item.paquete.precioConsumidor,
        subtotalCosto: item.subtotalCosto,
        subtotalPrecio: item.subtotalPrecio,
        subtotalComision: item.subtotalComision,
        subtotalUtilidadNeta: item.subtotalUtilidadNeta,
      })),
    };
  };

  const buildWhatsappMessage = () => {
    const nombres = detalleCombo.map((item) => `• ${item.nombre} x${item.cantidad}`).join("\n");

    return [
      "Hola, te comparto una propuesta comercial de combo Liqui Moly.",
      "",
      `Combo: ${comboNombreActual}`,
      "",
      nombres,
      "",
      `Ticket promedio: ${money(simulacion.ticketPromedio)}`,
      `Utilidad neta por combo: ${money(simulacion.utilidadNetaCombo)}`,
      `Ventas estimadas al mes: ${simulacion.ventasMes}`,
      `Utilidad mensual estimada para la agencia: ${money(simulacion.utilidadMensualAgencia)}`,
      "",
      "Es una propuesta pensada para subir ticket promedio, generar utilidad y vender con una estructura más clara.",
      "Si gustas, te explico cómo implementarlo y qué paquetes conviene mover primero.",
    ].join("\n");
  };

  const handleExportPdf = async () => {
    if (detalleCombo.length === 0) {
      alert("Primero agrega paquetes al combo.");
      return;
    }

    try {
      setPdfLoading(true);
      await descargarComboPDF(buildComboPdfData(), "combo-agencia-liqui-moly.pdf");
    } catch (error) {
      console.error("Error generando PDF del combo:", error);
      alert("No se pudo generar el PDF del combo.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (detalleCombo.length === 0) {
      alert("Primero agrega paquetes al combo.");
      return;
    }

    try {
      setWhatsLoading(true);

      const result = await compartirComboPdf(
        buildComboPdfData(),
        buildWhatsappMessage(),
        "combo-agencia-liqui-moly.pdf"
      );

      if (!result.sharedDirectly) {
        alert(
          "Se descargó el PDF y se abrió WhatsApp. Si estás en desktop, adjunta manualmente el archivo descargado."
        );
      }
    } catch (error) {
      console.error("Error compartiendo combo por WhatsApp:", error);
      alert("No se pudo compartir el combo por WhatsApp.");
    } finally {
      setWhatsLoading(false);
    }
  };

  const agregarPaquete = () => {
    setItemsCotizador((prev) => {
      const existente = prev.find((item) => item.nombre === paqueteParaAgregar);

      if (existente) {
        return prev.map((item) =>
          item.nombre === paqueteParaAgregar
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...prev, { nombre: paqueteParaAgregar, cantidad: 1 }];
    });
  };

  const quitarPaquete = (nombre: string) => {
    setItemsCotizador((prev) => prev.filter((item) => item.nombre !== nombre));
  };

  const cambiarCantidad = (nombre: string, cantidad: number) => {
    setItemsCotizador((prev) =>
      prev.map((item) =>
        item.nombre === nombre
          ? { ...item, cantidad: Math.max(1, Number(cantidad) || 1) }
          : item
      )
    );
  };

  const limpiarCombo = () => {
    setItemsCotizador([]);
  };

  const aplicarComboSugerido = (paquetes: string[]) => {
    setItemsCotizador(paquetes.map((nombre) => ({ nombre, cantidad: 1 })));
  };

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
    if (!editingForm.nombre.trim()) {
      alert("El nombre de la agencia es obligatorio.");
      return;
    }

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
              Gestiona agencias, detecta potencial comercial y cotiza combos de paquetes
              para demostrar utilidad real a la agencia y comisión fija al asesor.
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
            <h2 className="mt-2 text-xl font-bold">Negocio completo</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Aquí ya no cotizas un solo paquete: armas combos completos para subir ticket
              promedio y cerrar mejor.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total agencias</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{resumen.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Activas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{resumen.activas}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">En negociación</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{resumen.negociacion}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Alto potencial</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{resumen.altoPotencial}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">
            Cotizador comercial para agencias
          </h2>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Arma combos de varios paquetes, ajusta cantidades y simula utilidad de la
          agencia y comisión total del asesor.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {combosSugeridos.map((combo) => (
            <button
              key={combo.nombre}
              type="button"
              onClick={() => aplicarComboSugerido(combo.paquetes)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              {combo.nombre}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Agregar paquete al combo
            </label>
            <select
              value={paqueteParaAgregar}
              onChange={(e) => setPaqueteParaAgregar(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
            >
              {paquetesBase.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ventas estimadas al mes
            </label>
            <input
              type="number"
              min={0}
              value={ventasMes}
              onChange={(e) => setVentasMes(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={agregarPaquete} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
            <Button variant="outline" onClick={limpiarCombo} className="rounded-xl">
              Limpiar
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-700">Combo actual</p>
          </div>

          {detalleCombo.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No hay paquetes agregados. Selecciona uno y agrégalo al combo.
            </div>
          ) : (
            <div className="space-y-3">
              {detalleCombo.map((item) => (
                <div
                  key={item.nombre}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.3fr_110px_130px_130px_auto]"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Costo: {money(item.paquete.costoAgencia)} · Precio:{" "}
                      {money(item.paquete.precioConsumidor)}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidad(item.nombre, Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Subtotal</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {money(item.subtotalPrecio)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Utilidad neta</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {money(item.subtotalUtilidadNeta)}
                    </p>
                  </div>

                  <div className="flex items-start justify-end">
                    <button
                      type="button"
                      onClick={() => quitarPaquete(item.nombre)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Paquete</th>
                  <th className="px-4 py-3 text-right font-medium">Cant.</th>
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Comisión</th>
                  <th className="px-4 py-3 text-right font-medium">Utilidad neta</th>
                </tr>
              </thead>
              <tbody>
                {detalleCombo.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Agrega paquetes para ver el resumen del combo.
                    </td>
                  </tr>
                ) : (
                  detalleCombo.map((item) => (
                    <tr key={item.nombre} className="border-t border-slate-100">
                      <td className="px-4 py-3">{item.nombre}</td>
                      <td className="px-4 py-3 text-right">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right">{money(item.subtotalCosto)}</td>
                      <td className="px-4 py-3 text-right">{money(item.subtotalPrecio)}</td>
                      <td className="px-4 py-3 text-right">
                        {money(item.subtotalComision)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {money(item.subtotalUtilidadNeta)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Package2 className="h-4 w-4" />
              Costo total combo
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.costoTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HandCoins className="h-4 w-4" />
              Precio total combo
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.precioTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calculator className="h-4 w-4" />
              Utilidad bruta combo
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.utilidadTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HandCoins className="h-4 w-4" />
              Comisión total asesor
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.comisionTotalCombo)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Utilidad neta del combo</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {money(simulacion.utilidadNetaCombo)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Ticket promedio del combo</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {money(simulacion.ticketPromedio)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Ventas estimadas al mes</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {simulacion.ventasMes}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-sm text-violet-700">Piezas por combo</p>
            <p className="mt-2 text-3xl font-bold text-violet-900">
              {simulacion.piezasTotalesCombo}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5">
            <p className="text-sm text-slate-500">Utilidad mensual agencia</p>
            <p className="mt-2 text-4xl font-bold text-emerald-700">
              {money(simulacion.utilidadMensualAgencia)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ganancia mensual de la agencia considerando el combo y la comisión fija.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-5">
            <p className="text-sm text-slate-500">Comisión mensual asesor</p>
            <p className="mt-2 text-4xl font-bold text-blue-700">
              {money(simulacion.comisionMensualAsesor)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Comisión mensual total del asesor con base en el combo vendido.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Margen bruto del combo</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {simulacion.margenBrutoPct.toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Útil para defender el negocio frente a la agencia.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <strong>Lectura comercial:</strong> Si la agencia vende{" "}
          <strong>{simulacion.ventasMes}</strong> combos al mes, con un ticket promedio de{" "}
          <strong>{money(simulacion.ticketPromedio)}</strong>, la agencia gana{" "}
          <strong>{money(simulacion.utilidadMensualAgencia)}</strong> y el asesor gana{" "}
          <strong>{money(simulacion.comisionMensualAsesor)}</strong>.
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={pdfLoading || detalleCombo.length === 0}
            className="rounded-xl"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {pdfLoading ? "Generando PDF..." : "Exportar PDF"}
          </Button>

          <Button
            onClick={handleShareWhatsapp}
            disabled={whatsLoading || detalleCombo.length === 0}
            className="rounded-xl bg-green-600 text-white hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {whatsLoading ? "Preparando WhatsApp..." : "Compartir WhatsApp"}
          </Button>
        </div>
      </section>

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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Agencias</h2>
          <p className="text-sm text-slate-500">
            Base comercial lista para crecer a propuesta y detalle por agencia.
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
                            ? "Agencia prioritaria para presentar combos, utilidad y esquema de comisión fija."
                            : agencia.potencial === "medio"
                            ? "Agencia con potencial para desarrollar con seguimiento y propuesta inicial."
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

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">Nueva agencia</h3>
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