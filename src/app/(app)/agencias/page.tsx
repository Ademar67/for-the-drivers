"use client";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";
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
import {
  Building2,
  ArrowLeft,
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
  Package2,
  X,
  ShoppingCart,
  FileDown,
  MessageCircle,
  TrendingUp,
  Boxes,
  Calculator,
  Layers3,
  Save,
  CheckCircle2,
} from "lucide-react";

import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  compartirComboPdf,
  descargarComboPDF,
  type ComboPdfData,
} from "@/lib/pdf/generarComboPDF";
import {
  crearPropuestaAgencia,
  type PropuestaAgenciaItem,
} from "@/lib/firestore/propuestas-agencias";

type EstatusAgencia =
  | "prospecto"
  | "contactada"
  | "negociacion"
  | "activa"
  | "inactiva";

type PotencialAgencia = "bajo" | "medio" | "alto";

type Agencia = {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
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
  updatedAt?: any;
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

type ItemPaqueteMensual = {
  nombre: string;
  paquetesMes: number;
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

const plantillasSugeridas: {
  nombre: string;
  paquetes: { nombre: string; paquetesMes: number }[];
}[] = [
  {
    nombre: "Arranque",
    paquetes: [
      { nombre: "Complemento de mantenimiento", paquetesMes: 8 },
      { nombre: "Limpieza cuerpo de aceleración", paquetesMes: 6 },
      { nombre: "Paquete frenos", paquetesMes: 5 },
    ],
  },
  {
    nombre: "Preventivo",
    paquetes: [
      { nombre: "Complemento de mantenimiento", paquetesMes: 10 },
      { nombre: "Limpieza del sistema del aire acondicionado", paquetesMes: 6 },
      { nombre: "Paquete servicio sistema de refrigeración", paquetesMes: 6 },
    ],
  },
  {
    nombre: "Potencia",
    paquetes: [
      { nombre: "Potencia motor", paquetesMes: 6 },
      { nombre: "Protección para motor", paquetesMes: 6 },
      { nombre: "Paquete premium", paquetesMes: 4 },
    ],
  },
  {
    nombre: "Diesel",
    paquetes: [
      { nombre: "Limpieza preventiva de inyectores a diesel", paquetesMes: 8 },
      { nombre: "Protección para motor", paquetesMes: 5 },
    ],
  },
];

const escenarios = [
  {
    nombre: "Conservador",
    paquetes: [
      { nombre: "Complemento de mantenimiento", paquetesMes: 8 },
      { nombre: "Limpieza cuerpo de aceleración", paquetesMes: 6 },
      { nombre: "Paquete frenos", paquetesMes: 6 },
    ],
  },
  {
    nombre: "Medio",
    paquetes: [
      { nombre: "Complemento de mantenimiento", paquetesMes: 12 },
      { nombre: "Limpieza del sistema del aire acondicionado", paquetesMes: 8 },
      { nombre: "Paquete frenos", paquetesMes: 8 },
      { nombre: "Paquete servicio sistema de refrigeración", paquetesMes: 6 },
    ],
  },
  {
    nombre: "Agresivo",
    paquetes: [
      { nombre: "Complemento de mantenimiento", paquetesMes: 20 },
      { nombre: "Limpieza correctiva de inyectores", paquetesMes: 15 },
      { nombre: "Paquete premium", paquetesMes: 10 },
      { nombre: "Protección para motor", paquetesMes: 10 },
    ],
  },
] as const;

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
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
  const [itemsPaquetes, setItemsPaquetes] = useState<ItemPaqueteMensual[]>([
    { nombre: "Paquete premium", paquetesMes: 8 },
  ]);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [whatsLoading, setWhatsLoading] = useState(false);
  const [agenciaSeleccionadaId, setAgenciaSeleccionadaId] = useState<string>("");
  const [saveProposalLoading, setSaveProposalLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAgencias([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const cargarAgencias = async () => {
      setLoading(true);

      try {
        const agenciasRef = collection(db, "agencias");
        const q = query(agenciasRef, where("ownerId", "==", user.uid));
        const snapshot = await getDocs(q);

        if (!mounted) return;

        const data: Agencia[] = snapshot.docs.map((ds) => {
          const d: any = ds.data();

          return {
            id: ds.id,
            ownerId: d.ownerId ?? "",
            ownerEmail: d.ownerEmail ?? "",
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
            updatedAt: d.updatedAt,
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
      } catch (error) {
        console.error("Error cargando agencias:", error);
        if (mounted) setAgencias([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarAgencias();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const agenciasFiltradas = useMemo(() => {
    return agencias.filter((a) => {
      const term = search.toLowerCase();

      const matchesSearch =
        a.nombre.toLowerCase().includes(term) ||
        a.marca.toLowerCase().includes(term) ||
        a.contacto.toLowerCase().includes(term) ||
        a.ciudad.toLowerCase().includes(term);

      const matchesStatus =
        filterEstatus === "todos" ? true : a.estatus === filterEstatus;

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

  const agenciaSeleccionada = useMemo(() => {
    return agencias.find((a) => a.id === agenciaSeleccionadaId) ?? null;
  }, [agencias, agenciaSeleccionadaId]);

  const paquetesMap = useMemo(() => {
    return new Map(paquetesBase.map((p) => [p.nombre, p]));
  }, []);

  const detallePaquetes = useMemo(() => {
    return itemsPaquetes
      .map((item) => {
        const paquete = paquetesMap.get(item.nombre);
        if (!paquete) return null;

        const paquetesMes = Math.max(0, Number(item.paquetesMes) || 0);
        const costoUnitario = paquete.costoAgencia;
        const precioUnitario = paquete.precioConsumidor;
        const utilidadPorPaquete = precioUnitario - costoUnitario;
        const costoMensual = costoUnitario * paquetesMes;
        const ventaMensual = precioUnitario * paquetesMes;
        const utilidadMensualBruta = utilidadPorPaquete * paquetesMes;
        const comisionMensual = COMISION_ASESOR_POR_PAQUETE * paquetesMes;
        const utilidadMensualNeta = utilidadMensualBruta - comisionMensual;

        return {
          nombre: item.nombre,
          paquetesMes,
          paquete,
          costoUnitario,
          precioUnitario,
          utilidadPorPaquete,
          costoMensual,
          ventaMensual,
          utilidadMensualBruta,
          comisionMensual,
          utilidadMensualNeta,
        };
      })
      .filter(Boolean) as Array<{
      nombre: string;
      paquetesMes: number;
      paquete: PaqueteSimulador;
      costoUnitario: number;
      precioUnitario: number;
      utilidadPorPaquete: number;
      costoMensual: number;
      ventaMensual: number;
      utilidadMensualBruta: number;
      comisionMensual: number;
      utilidadMensualNeta: number;
    }>;
  }, [itemsPaquetes, paquetesMap]);

  const simulacion = useMemo(() => {
    const paquetesTotalesMes = detallePaquetes.reduce(
      (acc, item) => acc + item.paquetesMes,
      0
    );

    const costoMensual = detallePaquetes.reduce(
      (acc, item) => acc + item.costoMensual,
      0
    );
    const ventaMensual = detallePaquetes.reduce(
      (acc, item) => acc + item.ventaMensual,
      0
    );
    const utilidadMensualBruta = detallePaquetes.reduce(
      (acc, item) => acc + item.utilidadMensualBruta,
      0
    );
    const comisionMensualAsesor = detallePaquetes.reduce(
      (acc, item) => acc + item.comisionMensual,
      0
    );
    const utilidadMensualAgencia = detallePaquetes.reduce(
      (acc, item) => acc + item.utilidadMensualNeta,
      0
    );

    const margenBrutoPct =
      ventaMensual > 0 ? (utilidadMensualBruta / ventaMensual) * 100 : 0;

    const ticketPromedio =
      paquetesTotalesMes > 0 ? ventaMensual / paquetesTotalesMes : 0;

    return {
      paquetesTotalesMes,
      costoMensual,
      ventaMensual,
      utilidadMensualBruta,
      utilidadMensualAgencia,
      comisionMensualAsesor,
      margenBrutoPct,
      ticketPromedio,
    };
  }, [detallePaquetes]);

  const nombrePropuestaActual = useMemo(() => {
    if (detallePaquetes.length === 0) return "Estimado comercial mensual";
    if (detallePaquetes.length === 1) {
      return `Proyección mensual · ${detallePaquetes[0].nombre}`;
    }
    return `Proyección mensual de ${detallePaquetes.length} paquetes`;
  }, [detallePaquetes]);

  const buildComboPdfData = (): ComboPdfData => {
    return {
      agenciaNombre: agenciaSeleccionada?.nombre?.trim() || "Agencia objetivo",
      comboNombre: nombrePropuestaActual,
      ventasMes: simulacion.paquetesTotalesMes,
      piezasTotalesCombo: simulacion.paquetesTotalesMes,
      costoTotal: simulacion.costoMensual,
      precioTotal: simulacion.ventaMensual,
      utilidadTotal: simulacion.utilidadMensualBruta,
      utilidadNetaCombo: 0,
      comisionTotalCombo: simulacion.comisionMensualAsesor,
      utilidadMensualAgencia: simulacion.utilidadMensualAgencia,
      comisionMensualAsesor: simulacion.comisionMensualAsesor,
      ticketPromedio: simulacion.ticketPromedio,
      margenBrutoPct: simulacion.margenBrutoPct,
      observaciones:
        "Propuesta basada en un modelo de negocio mensual por paquetes, enfocada en incrementar utilidad sin depender del volumen.",
      generatedAt: new Date(),
      items: detallePaquetes.map((item) => ({
        nombre: `${item.nombre} · ${item.paquetesMes} paquetes/mes`,
        cantidad: item.paquetesMes,
        costoUnitario: item.costoUnitario,
        precioUnitario: item.precioUnitario,
        subtotalCosto: item.costoMensual,
        subtotalPrecio: item.ventaMensual,
        subtotalComision: item.comisionMensual,
        subtotalUtilidadNeta: item.utilidadMensualNeta,
      })),
    };
  };

  const buildWhatsappMessage = () => {
    return [
      "Hola, te preparé una proyección real de negocio con Liqui Moly 👇",
      "",
      `🏢 Agencia: ${agenciaSeleccionada?.nombre || "Agencia objetivo"}`,
      `📦 Paquetes al mes: ${simulacion.paquetesTotalesMes}`,
      `💰 Venta mensual: ${money(simulacion.ventaMensual)}`,
      `📈 Utilidad estimada: ${money(simulacion.utilidadMensualAgencia)}`,
      "",
      "Esto no es una compra… es una nueva línea de ingreso para tu negocio.",
      "",
      "Si quieres lo vemos juntos y lo ajustamos a tu operación 👍",
    ].join("\n");
  };

  const handleGuardarPropuesta = async () => {
    if (!agenciaSeleccionada) {
      alert("Primero selecciona una agencia para guardar la propuesta.");
      return;
    }

    if (detallePaquetes.length === 0) {
      alert("Primero agrega paquetes al simulador.");
      return;
    }

    try {
      setSaveProposalLoading(true);

      const items: PropuestaAgenciaItem[] = detallePaquetes.map((item) => ({
        nombre: item.nombre,
        paquetesMes: item.paquetesMes,
        costoUnitario: item.costoUnitario,
        precioUnitario: item.precioUnitario,
        costoMensual: item.costoMensual,
        ventaMensual: item.ventaMensual,
        utilidadMensualBruta: item.utilidadMensualBruta,
        comisionMensual: item.comisionMensual,
        utilidadMensualNeta: item.utilidadMensualNeta,
      }));

      await crearPropuestaAgencia({
        agenciaId: agenciaSeleccionada.id,
        agenciaNombre: agenciaSeleccionada.nombre,
        nombrePropuesta: nombrePropuestaActual,
        items,
        paquetesTotalesMes: simulacion.paquetesTotalesMes,
        costoMensual: simulacion.costoMensual,
        ventaMensual: simulacion.ventaMensual,
        utilidadMensualBruta: simulacion.utilidadMensualBruta,
        utilidadMensualAgencia: simulacion.utilidadMensualAgencia,
        comisionMensualAsesor: simulacion.comisionMensualAsesor,
        margenBrutoPct: simulacion.margenBrutoPct,
        ticketPromedio: simulacion.ticketPromedio,
      });

      alert("Propuesta guardada correctamente.");
    } catch (error) {
      console.error("Error guardando propuesta:", error);
      alert("No se pudo guardar la propuesta.");
    } finally {
      setSaveProposalLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (detallePaquetes.length === 0) {
      alert("Primero agrega paquetes al estimado.");
      return;
    }

    try {
      setPdfLoading(true);
      await descargarComboPDF(
        buildComboPdfData(),
        "propuesta-rentabilidad-liqui-moly.pdf"
      );
    } catch (error) {
      console.error("Error generando PDF del estimado:", error);
      alert("No se pudo generar el PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (detallePaquetes.length === 0) {
      alert("Primero agrega paquetes al estimado.");
      return;
    }

    try {
      setWhatsLoading(true);

      const result = await compartirComboPdf(
        buildComboPdfData(),
        buildWhatsappMessage(),
        "propuesta-rentabilidad-liqui-moly.pdf"
      );

      if (!result.sharedDirectly) {
        alert(
          "Se descargó el PDF y se abrió WhatsApp. Si estás en desktop, adjunta manualmente el archivo descargado."
        );
      }
    } catch (error) {
      console.error("Error compartiendo por WhatsApp:", error);
      alert("No se pudo compartir el estimado por WhatsApp.");
    } finally {
      setWhatsLoading(false);
    }
  };

  const agregarPaquete = () => {
    setItemsPaquetes((prev) => {
      const existente = prev.find((item) => item.nombre === paqueteParaAgregar);

      if (existente) {
        return prev.map((item) =>
          item.nombre === paqueteParaAgregar
            ? { ...item, paquetesMes: item.paquetesMes + 1 }
            : item
        );
      }

      return [...prev, { nombre: paqueteParaAgregar, paquetesMes: 1 }];
    });
  };

  const quitarPaquete = (nombre: string) => {
    setItemsPaquetes((prev) => prev.filter((item) => item.nombre !== nombre));
  };

  const cambiarPaquetesMes = (nombre: string, paquetesMes: number) => {
    setItemsPaquetes((prev) =>
      prev.map((item) =>
        item.nombre === nombre
          ? { ...item, paquetesMes: Math.max(0, Number(paquetesMes) || 0) }
          : item
      )
    );
  };

  const limpiarPaquetes = () => {
    setItemsPaquetes([]);
  };

  const aplicarPlantilla = (
    paquetes: { nombre: string; paquetesMes: number }[]
  ) => {
    setItemsPaquetes(paquetes);
  };

  const aplicarEscenario = (escenario: (typeof escenarios)[number]) => {
    setItemsPaquetes([...escenario.paquetes]);
  };

  const handleCreate = async () => {
    if (!user) {
      alert("Debes iniciar sesión para crear agencias.");
      return;
    }

    if (!form.nombre.trim()) {
      alert("El nombre de la agencia es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "agencias"), {
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        ...form,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(initialForm);
      setOpenModal(false);

      const q = query(collection(db, "agencias"), where("ownerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data: Agencia[] = snapshot.docs.map((ds) => {
        const d: any = ds.data();
        return {
          id: ds.id,
          ownerId: d.ownerId ?? "",
          ownerEmail: d.ownerEmail ?? "",
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
          updatedAt: d.updatedAt,
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
    if (!user) {
      alert("Debes iniciar sesión para editar agencias.");
      return;
    }

    if (!editingForm.nombre.trim()) {
      alert("El nombre de la agencia es obligatorio.");
      return;
    }

    try {
      await updateDoc(doc(db, "agencias", id), {
        ...editingForm,
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        updatedAt: serverTimestamp(),
      });

      setAgencias((prev) =>
        prev.map((agencia) =>
          agencia.id === id
            ? {
                ...agencia,
                ...editingForm,
                ownerId: user.uid,
                ownerEmail: user.email ?? "",
              }
            : agencia
        )
      );

      setEditingId(null);
      setEditingForm(initialForm);
    } catch (error) {
      console.error("Error actualizando agencia:", error);
      alert("No se pudo actualizar la agencia.");
    }
  };

  const removeAgencia = async (id: string, nombre: string) => {
    if (!user) {
      alert("Debes iniciar sesión para eliminar agencias.");
      return;
    }

    const ok = window.confirm(`¿Seguro que quieres eliminar la agencia "${nombre}"?`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "agencias", id));
      setAgencias((prev) => prev.filter((agencia) => agencia.id !== id));
    } catch (error) {
      console.error("Error eliminando agencia:", error);
      alert("No se pudo eliminar la agencia.");
    }
  };

  if (authLoading) {
    return <div className="space-y-6">Cargando agencias...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Briefcase className="h-3.5 w-3.5" />
              Módulo Comercial
            </div>

                  <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Agencias PRO
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Gestiona agencias y proyecta venta mensual por paquete para presentar una
              propuesta más clara, rentable y fácil de defender frente a la agencia.
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
            <h2 className="mt-2 text-xl font-bold">Modo paquetes + escenarios</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Aquí proyectas directamente cuántos paquetes movería la agencia al mes,
              cuánto vendería, cuánto ganaría y qué comisión generaría el esquema.
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">
            Simulador mensual por paquete
          </h2>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Captura cuántos paquetes se venderían al mes por tipo. El sistema calcula solo
          costo, venta, utilidad, comisión y utilidad neta.
        </p>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Agencia seleccionada
            </label>
            <select
              value={agenciaSeleccionadaId}
              onChange={(e) => setAgenciaSeleccionadaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
            >
              <option value="">Selecciona una agencia</option>
              {agencias.map((agencia) => (
                <option key={agencia.id} value={agencia.id}>
                  {agencia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Propuesta vinculada
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {agenciaSeleccionada?.nombre || "Sin agencia seleccionada"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {agenciaSeleccionada?.ciudad ||
                "Selecciona una agencia para guardar esta propuesta."}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {escenarios.map((esc) => (
            <button
              key={esc.nombre}
              type="button"
              onClick={() => aplicarEscenario(esc)}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Escenario {esc.nombre}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {plantillasSugeridas.map((plantilla) => (
            <button
              key={plantilla.nombre}
              type="button"
              onClick={() => aplicarPlantilla(plantilla.paquetes)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              {plantilla.nombre}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Agregar paquete al simulador
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

          <div className="flex items-end gap-2">
            <Button onClick={agregarPaquete} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
            <Button variant="outline" onClick={limpiarPaquetes} className="rounded-xl">
              Limpiar
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-700">Paquetes cargados</p>
          </div>

          {detallePaquetes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No hay paquetes agregados. Selecciona uno y agrégalo al simulador.
            </div>
          ) : (
            <div className="space-y-3">
              {detallePaquetes.map((item) => (
                <div
                  key={item.nombre}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.5fr_120px_140px_140px_auto]"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Costo unitario: {money(item.costoUnitario)} · Precio unitario:{" "}
                      {money(item.precioUnitario)}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Paquetes/mes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.paquetesMes}
                      onChange={(e) =>
                        cambiarPaquetesMes(item.nombre, Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Venta mensual</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {money(item.ventaMensual)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Utilidad neta</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {money(item.utilidadMensualNeta)}
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
            <table className="min-w-[1300px] bg-white text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Paquete</th>
                  <th className="px-4 py-3 text-right font-medium">Costo unitario</th>
                  <th className="px-4 py-3 text-right font-medium">Precio unitario</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Utilidad por paquete
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Paquetes por mes</th>
                  <th className="px-4 py-3 text-right font-medium">Costo mensual</th>
                  <th className="px-4 py-3 text-right font-medium">Venta mensual</th>
                  <th className="px-4 py-3 text-right font-medium">Utilidad mensual</th>
                  <th className="px-4 py-3 text-right font-medium">Comisión mensual</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Utilidad neta mensual
                  </th>
                </tr>
              </thead>
              <tbody>
                {detallePaquetes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                      Agrega paquetes para ver el simulador mensual.
                    </td>
                  </tr>
                ) : (
                  detallePaquetes.map((item) => (
                    <tr key={item.nombre} className="border-t border-slate-100">
                      <td className="px-4 py-3">{item.nombre}</td>
                      <td className="px-4 py-3 text-right">
                        {money(item.costoUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {money(item.precioUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {money(item.utilidadPorPaquete)}
                      </td>
                      <td className="px-4 py-3 text-right">{item.paquetesMes}</td>
                      <td className="px-4 py-3 text-right">{money(item.costoMensual)}</td>
                      <td className="px-4 py-3 text-right">{money(item.ventaMensual)}</td>
                      <td className="px-4 py-3 text-right">
                        {money(item.utilidadMensualBruta)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {money(item.comisionMensual)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {money(item.utilidadMensualNeta)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {detallePaquetes.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr className="font-semibold text-slate-900">
                    <td className="px-4 py-3">Totales</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">
                      {simulacion.paquetesTotalesMes}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(simulacion.costoMensual)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(simulacion.ventaMensual)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(simulacion.utilidadMensualBruta)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(simulacion.comisionMensualAsesor)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {money(simulacion.utilidadMensualAgencia)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Boxes className="h-4 w-4" />
              Paquetes totales al mes
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {simulacion.paquetesTotalesMes}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShoppingCart className="h-4 w-4" />
              Venta mensual
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.ventaMensual)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HandCoins className="h-4 w-4" />
              Comisión mensual asesor
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.comisionMensualAsesor)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Package2 className="h-4 w-4" />
              Ticket promedio por paquete
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(simulacion.ticketPromedio)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Costo mensual estimado</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {money(simulacion.costoMensual)}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-700">Venta mensual estimada</p>
            <p className="mt-2 text-3xl font-bold text-indigo-900">
              {money(simulacion.ventaMensual)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">Utilidad bruta mensual</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {money(simulacion.utilidadMensualBruta)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">Margen bruto estimado</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {simulacion.margenBrutoPct.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5">
            <p className="text-sm text-slate-500">Utilidad mensual agencia</p>
            <p className="mt-2 text-4xl font-bold text-emerald-700">
              {money(simulacion.utilidadMensualAgencia)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Utilidad mensual estimada después de considerar la comisión fija por
              paquete.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-5">
            <p className="text-sm text-slate-500">Comisión mensual asesor</p>
            <p className="mt-2 text-4xl font-bold text-blue-700">
              {money(simulacion.comisionMensualAsesor)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Comisión mensual total estimada con base en los paquetes proyectados.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <strong>Lectura comercial:</strong> Si la agencia implementa este modelo con{" "}
          <strong>{simulacion.paquetesTotalesMes} paquetes</strong> mensuales, puede
          generar ingresos por <strong>{money(simulacion.ventaMensual)}</strong> y una
          utilidad aproximada de{" "}
          <strong>{money(simulacion.utilidadMensualAgencia)}</strong>. Esto permite
          dejar de competir por precio y comenzar a operar con un modelo enfocado en
          rentabilidad.
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleGuardarPropuesta}
            disabled={saveProposalLoading || detallePaquetes.length === 0}
            className="rounded-xl"
          >
            {saveProposalLoading ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Guardar propuesta
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={pdfLoading || detallePaquetes.length === 0}
            className="rounded-xl"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {pdfLoading ? "Generando PDF..." : "Exportar PDF"}
          </Button>

          <Button
            onClick={handleShareWhatsapp}
            disabled={whatsLoading || detallePaquetes.length === 0}
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
                          <TrendingUp className="h-4 w-4" />
                          Enfoque comercial
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {agencia.potencial === "alto"
                            ? "Agencia prioritaria para presentar estimados mensuales, utilidad y esquema de comisión fija por paquete."
                            : agencia.potencial === "medio"
                            ? "Agencia con potencial para desarrollar con seguimiento y propuesta mensual inicial."
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