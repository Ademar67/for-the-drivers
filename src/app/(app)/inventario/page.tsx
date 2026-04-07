"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

import { stores } from "@/lib/stores";
import { db } from "@/firebase/config";

type ChainOption = "AutoZone" | "OReilly" | "Liverpool" | "";

type ProductoCatalogo = {
  id: string;
  nombre: string;
  codigo?: string;
};

type ProductRow = {
  id: string;
  product: string;
  quantity: number;
  productId?: string;
  codigo?: string;
};

type VisitRow = {
  id: string;
  cadena: ChainOption;
  tiendaId: string;
  observaciones: string;
  productos: ProductRow[];
};

type InventarioConstruido = {
  nombre: string;
  fecha: string;
  observacionesGenerales: string;
  visitas: Array<{
    id: string;
    cadena: ChainOption;
    tiendaId: string;
    tiendaNombre: string;
    ciudad: string;
    estado: string;
    observaciones: string;
    productos: ProductRow[];
  }>;
};

type InventarioFirestore = {
  id: string;
  nombre: string;
  fecha: string;
  observacionesGenerales?: string;
  visitas?: Array<{
    id?: string;
    cadena: ChainOption;
    tiendaId: string;
    tiendaNombre?: string;
    ciudad?: string;
    estado?: string;
    observaciones?: string;
    productos?: ProductRow[];
  }>;
};

function formatToday() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function createVisitRow(): VisitRow {
  return {
    id: createId(),
    cadena: "",
    tiendaId: "",
    observaciones: "",
    productos: [],
  };
}

export default function InventarioPage() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(formatToday());
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [visitas, setVisitas] = useState<VisitRow[]>([createVisitRow()]);
  const [guardandoFirebase, setGuardandoFirebase] = useState(false);
  const [cargandoInventarioDia, setCargandoInventarioDia] = useState(false);
  const [inventarioExistenteId, setInventarioExistenteId] = useState<string | null>(null);

  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [busquedas, setBusquedas] = useState<Record<string, string>>({});
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  useEffect(() => {
    async function fetchProductos() {
      try {
        const snap = await getDocs(collection(db, "productos"));

        const prods = snap.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>;

            const nombre =
              (typeof data.nombre === "string" && data.nombre) ||
              (typeof data.name === "string" && data.name) ||
              (typeof data.producto === "string" && data.producto) ||
              "";

            const codigo =
              (typeof data.codigo === "string" && data.codigo) ||
              (typeof data.code === "string" && data.code) ||
              "";

            return {
              id: doc.id,
              nombre: nombre.trim(),
              codigo: codigo.trim(),
            };
          })
          .filter((p) => p.nombre !== "");

        setProductos(prods);
      } catch (error) {
        console.error("Error cargando catálogo de productos:", error);
      } finally {
        setCargandoCatalogo(false);
      }
    }

    fetchProductos();
  }, []);

  useEffect(() => {
    const borrador = localStorage.getItem("inventario-diario-borrador");

    if (!borrador) return;

    try {
      const parsed = JSON.parse(borrador) as InventarioConstruido;

      if (parsed.nombre) setNombre(parsed.nombre);
      if (parsed.fecha) setFecha(parsed.fecha);
      if (parsed.observacionesGenerales) {
        setObservacionesGenerales(parsed.observacionesGenerales);
      }

      if (parsed.visitas && parsed.visitas.length > 0) {
        const visitasConvertidas: VisitRow[] = parsed.visitas.map((visita) => ({
          id: visita.id || createId(),
          cadena: visita.cadena || "",
          tiendaId: visita.tiendaId || "",
          observaciones: visita.observaciones || "",
          productos: Array.isArray(visita.productos)
            ? visita.productos.map((producto) => ({
                id: producto.id || createId(),
                product: producto.product || "",
                quantity: Number(producto.quantity) || 0,
                productId: producto.productId,
                codigo: producto.codigo,
              }))
            : [],
        }));

        setVisitas(visitasConvertidas.length > 0 ? visitasConvertidas : [createVisitRow()]);
      }
    } catch (error) {
      console.error("Error al cargar borrador local:", error);
    }
  }, []);

  const totalProductosValidos = useMemo(() => {
    return visitas.reduce((acc, visita) => {
      return (
        acc +
        visita.productos.filter(
          (item) => item.product.trim() !== "" && item.quantity > 0
        ).length
      );
    }, 0);
  }, [visitas]);

  function agregarVisita() {
    const nueva = createVisitRow();
    setVisitas((prev) => [...prev, nueva]);
    setBusquedas((prev) => ({ ...prev, [nueva.id]: "" }));
  }

  function eliminarVisita(visitId: string) {
    setVisitas((prev) => {
      const nuevasVisitas = prev.filter((visita) => visita.id !== visitId);
      return nuevasVisitas.length > 0 ? nuevasVisitas : [createVisitRow()];
    });

    setBusquedas((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
  }

  function actualizarBusqueda(visitId: string, value: string) {
    setBusquedas((prev) => ({
      ...prev,
      [visitId]: value,
    }));
  }

  function actualizarVisita(
    visitId: string,
    field: "cadena" | "tiendaId" | "observaciones",
    value: string
  ) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        if (field === "cadena") {
          return {
            ...visita,
            cadena: value as ChainOption,
            tiendaId: "",
          };
        }

        if (field === "tiendaId") {
          return {
            ...visita,
            tiendaId: value,
          };
        }

        return {
          ...visita,
          observaciones: value,
        };
      })
    );
  }

  function agregarProductoDesdeCatalogo(
    visitId: string,
    producto: ProductoCatalogo
  ) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        const existente = visita.productos.find(
          (item) =>
            item.productId === producto.id || item.product === producto.nombre
        );

        if (existente) {
          return {
            ...visita,
            productos: visita.productos.map((item) =>
              item.productId === producto.id || item.product === producto.nombre
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }

        return {
          ...visita,
          productos: [
            ...visita.productos,
            {
              id: createId(),
              productId: producto.id,
              product: producto.nombre,
              codigo: producto.codigo,
              quantity: 1,
            },
          ],
        };
      })
    );

    setBusquedas((prev) => ({
      ...prev,
      [visitId]: "",
    }));
  }

  function eliminarProducto(visitId: string, productRowId: string) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        return {
          ...visita,
          productos: visita.productos.filter((item) => item.id !== productRowId),
        };
      })
    );
  }

  function handleCantidadChange(
    visitId: string,
    productRowId: string,
    cantidad: number
  ) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        return {
          ...visita,
          productos: visita.productos.map((item) =>
            item.id === productRowId
              ? { ...item, quantity: Math.max(0, cantidad || 0) }
              : item
          ),
        };
      })
    );
  }

  function construirInventario(): InventarioConstruido {
    return {
      nombre: nombre.trim(),
      fecha,
      observacionesGenerales: observacionesGenerales.trim(),
      visitas: visitas
        .map((visita) => {
          const tienda = stores.find((store) => store.id === visita.tiendaId);

          return {
            id: visita.id,
            cadena: visita.cadena,
            tiendaId: visita.tiendaId,
            tiendaNombre: tienda?.name || "",
            ciudad: tienda?.city || "",
            estado: tienda?.state || "",
            observaciones: visita.observaciones.trim(),
            productos: visita.productos.filter(
              (item) => item.product.trim() !== "" && item.quantity > 0
            ),
          };
        })
        .filter(
          (visita) =>
            visita.cadena !== "" &&
            visita.tiendaId !== "" &&
            visita.productos.length > 0
        ),
    };
  }

  function handleGuardarBorrador() {
    const inventario = construirInventario();
    localStorage.setItem(
      "inventario-diario-borrador",
      JSON.stringify(inventario)
    );
    alert("Inventario diario guardado temporalmente en este dispositivo.");
  }

  async function handleCargarInventarioDelDia() {
    if (!nombre.trim()) {
      alert("Escribe tu nombre para buscar tu inventario del día.");
      return;
    }

    if (!fecha) {
      alert("Selecciona una fecha para buscar el inventario.");
      return;
    }

    try {
      setCargandoInventarioDia(true);

      const q = query(
        collection(db, "inventarios"),
        where("nombre", "==", nombre.trim()),
        where("fecha", "==", fecha)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setInventarioExistenteId(null);
        alert("No encontré inventario guardado para ese nombre y fecha.");
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data() as InventarioFirestore;

      const visitasCargadas: VisitRow[] =
        Array.isArray(data.visitas) && data.visitas.length > 0
          ? data.visitas.map((visita) => ({
              id: visita.id || createId(),
              cadena: visita.cadena || "",
              tiendaId: visita.tiendaId || "",
              observaciones: visita.observaciones || "",
              productos: Array.isArray(visita.productos)
                ? visita.productos.map((producto) => ({
                    id: producto.id || createId(),
                    product: producto.product || "",
                    quantity: Number(producto.quantity) || 0,
                    productId: producto.productId,
                    codigo: producto.codigo,
                  }))
                : [],
            }))
          : [createVisitRow()];

      setInventarioExistenteId(docSnap.id);
      setObservacionesGenerales(data.observacionesGenerales || "");
      setVisitas(visitasCargadas);

      localStorage.setItem(
        "inventario-diario-borrador",
        JSON.stringify({
          nombre: data.nombre,
          fecha: data.fecha,
          observacionesGenerales: data.observacionesGenerales || "",
          visitas: data.visitas || [],
        })
      );

      alert("Inventario del día cargado correctamente. Ya puedes seguir capturando tiendas.");
    } catch (error) {
      console.error("Error al cargar inventario del día:", error);
      alert("Ocurrió un error al buscar el inventario guardado.");
    } finally {
      setCargandoInventarioDia(false);
    }
  }

  async function handleGuardarFirebase() {
    const inventario = construirInventario();

    if (!inventario.nombre) {
      alert("Escribe tu nombre antes de guardar.");
      return;
    }

    if (!inventario.fecha) {
      alert("Selecciona una fecha antes de guardar.");
      return;
    }

    if (inventario.visitas.length === 0) {
      alert("Agrega al menos una tienda con productos válidos.");
      return;
    }

    try {
      setGuardandoFirebase(true);

      let registroId = inventarioExistenteId;

      if (!registroId) {
        const q = query(
          collection(db, "inventarios"),
          where("nombre", "==", inventario.nombre),
          where("fecha", "==", inventario.fecha)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          registroId = snap.docs[0].id;
          setInventarioExistenteId(registroId);
        }
      }

      if (registroId) {
        const q = query(
          collection(db, "inventarios"),
          where("nombre", "==", inventario.nombre),
          where("fecha", "==", inventario.fecha)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, {
            nombre: inventario.nombre,
            fecha: inventario.fecha,
            observacionesGenerales: inventario.observacionesGenerales,
            visitas: inventario.visitas,
            totalTiendas: inventario.visitas.length,
            totalProductos: inventario.visitas.reduce(
              (acc, visita) => acc + visita.productos.length,
              0
            ),
            updatedAt: serverTimestamp(),
          });

          localStorage.setItem(
            "inventario-diario-borrador",
            JSON.stringify(inventario)
          );

          alert("Inventario actualizado correctamente en Firebase.");
          return;
        }
      }

      const nuevoDoc = await addDoc(collection(db, "inventarios"), {
        nombre: inventario.nombre,
        fecha: inventario.fecha,
        observacionesGenerales: inventario.observacionesGenerales,
        visitas: inventario.visitas,
        totalTiendas: inventario.visitas.length,
        totalProductos: inventario.visitas.reduce(
          (acc, visita) => acc + visita.productos.length,
          0
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setInventarioExistenteId(nuevoDoc.id);

      localStorage.setItem(
        "inventario-diario-borrador",
        JSON.stringify(inventario)
      );

      alert("Inventario guardado correctamente en Firebase.");
    } catch (error) {
      console.error("Error al guardar inventario en Firebase:", error);
      alert("Ocurrió un error al guardar en Firebase.");
    } finally {
      setGuardandoFirebase(false);
    }
  }

  function handleGenerarPDF() {
    const inventario = construirInventario();

    if (!inventario.nombre) {
      alert("Escribe tu nombre antes de generar el PDF.");
      return;
    }

    if (!inventario.fecha) {
      alert("Selecciona una fecha antes de generar el PDF.");
      return;
    }

    if (inventario.visitas.length === 0) {
      alert("Agrega al menos una tienda con productos válidos para generar el PDF.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Reporte de Inventario Diario – Liqui Moly Retail", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${inventario.nombre}`, 14, 28);
    doc.text(`Fecha: ${inventario.fecha}`, 14, 34);

    const observacionesTexto = inventario.observacionesGenerales
      ? inventario.observacionesGenerales
      : "Sin observaciones generales";

    const observacionesLineas = doc.splitTextToSize(
      `Observaciones generales: ${observacionesTexto}`,
      pageWidth - 28
    );

    doc.text(observacionesLineas, 14, 40);

    let y = 40 + observacionesLineas.length * 6 + 6;

    inventario.visitas.forEach((visita, index) => {
      const tiendaTitulo = `Tienda ${index + 1}: ${visita.cadena} - ${visita.tiendaNombre}`;

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(tiendaTitulo, 14, y);

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const detalleTienda = [
        `Ciudad / Estado: ${visita.ciudad || "-"} / ${visita.estado || "-"}`,
        `Observaciones: ${visita.observaciones || "Sin observaciones"}`,
      ];

      const detalleLineas = doc.splitTextToSize(
        detalleTienda.join("   "),
        pageWidth - 28
      );

      doc.text(detalleLineas, 14, y);
      y += detalleLineas.length * 6 + 2;

      autoTable(doc, {
        startY: y,
        head: [["Producto", "Cantidad"]],
        body: visita.productos.map((producto) => [
          producto.codigo
            ? `${producto.product} (${producto.codigo})`
            : producto.product,
          String(producto.quantity),
        ]),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [15, 59, 130],
        },
        margin: { left: 14, right: 14 },
      });

      const finalY = (
        doc as jsPDF & {
          lastAutoTable?: { finalY: number };
        }
      ).lastAutoTable?.finalY;

      y = finalY ? finalY + 10 : y + 10;
    });

    const fechaArchivo = inventario.fecha || formatToday();
    doc.save(`reporte-inventario-diario-${fechaArchivo}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Inventario diario
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Captura varias tiendas en un solo inventario del día.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {cargandoCatalogo
              ? "Cargando catálogo de productos..."
              : `Catálogo cargado: ${productos.length} productos`}
          </p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Datos generales
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. David"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observaciones generales
                </label>
                <textarea
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  placeholder="Ej. Ruta del día, comentarios generales, incidencias..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCargarInventarioDelDia}
                disabled={cargandoInventarioDia}
                className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargandoInventarioDia
                  ? "Buscando inventario..."
                  : "Cargar inventario del día"}
              </button>

              {inventarioExistenteId ? (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  Inventario del día localizado. Lo que guardes se actualizará.
                </div>
              ) : (
                <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
                  Aún no hay inventario cargado para este nombre y fecha.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Tiendas visitadas
                </h2>
                <p className="text-sm text-gray-600">
                  Agrega todas las tiendas que visitaste hoy en un solo inventario.
                </p>
              </div>

              <button
                type="button"
                onClick={agregarVisita}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Agregar tienda
              </button>
            </div>

            <div className="space-y-6">
              {visitas.map((visita, visitIndex) => {
                const tiendasFiltradas = visita.cadena
                  ? stores.filter((store) => store.chain === visita.cadena)
                  : [];

                const tiendaSeleccionada = stores.find(
                  (store) => store.id === visita.tiendaId
                );

                const productosValidos = visita.productos.filter(
                  (item) => item.product.trim() !== "" && item.quantity > 0
                ).length;

                const busqueda = busquedas[visita.id] || "";

                const productosFiltrados = busqueda
                  ? productos.filter(
                      (p) =>
                        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                        (p.codigo || "")
                          .toLowerCase()
                          .includes(busqueda.toLowerCase())
                    )
                  : [];

                return (
                  <div
                    key={visita.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Tienda #{visitIndex + 1}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Captura cadena, tienda, observaciones y productos.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarVisita(visita.id)}
                        disabled={visitas.length === 1}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Eliminar tienda
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Cadena
                        </label>
                        <select
                          value={visita.cadena}
                          onChange={(e) =>
                            actualizarVisita(visita.id, "cadena", e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Selecciona una cadena</option>
                          <option value="AutoZone">AutoZone</option>
                          <option value="OReilly">OReilly</option>
                          <option value="Liverpool">Liverpool</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Tienda
                        </label>
                        <select
                          value={visita.tiendaId}
                          onChange={(e) =>
                            actualizarVisita(visita.id, "tiendaId", e.target.value)
                          }
                          disabled={!visita.cadena}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">
                            {visita.cadena
                              ? "Selecciona una tienda"
                              : "Primero selecciona una cadena"}
                          </option>

                          {tiendasFiltradas.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name} - {store.city}, {store.state}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Observaciones de esta tienda
                        </label>
                        <textarea
                          value={visita.observaciones}
                          onChange={(e) =>
                            actualizarVisita(
                              visita.id,
                              "observaciones",
                              e.target.value
                            )
                          }
                          placeholder="Ej. Falta acomodo, promo visible, anaquel incompleto..."
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-3">
                        <h4 className="text-base font-semibold text-gray-900">
                          Buscar productos
                        </h4>
                      </div>

                      <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={busqueda}
                        onChange={(e) =>
                          actualizarBusqueda(visita.id, e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white p-3"
                      />

                      {productosFiltrados.length > 0 && (
                        <ul className="mt-2 max-h-60 overflow-y-auto rounded-xl border bg-white">
                          {productosFiltrados.slice(0, 10).map((p) => (
                            <li
                              key={p.id}
                              onClick={() => agregarProductoDesdeCatalogo(visita.id, p)}
                              className="cursor-pointer border-b p-3 hover:bg-blue-50"
                            >
                              <p className="font-medium">{p.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {p.codigo || "Sin código"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            Productos de esta tienda
                          </h4>
                          <p className="text-sm text-gray-600">
                            Seleccionados desde el catálogo.
                          </p>
                        </div>
                      </div>

                      {visita.productos.length === 0 ? (
                        <p className="rounded-xl border bg-white p-4 text-sm text-gray-500">
                          Aún no has agregado productos a esta tienda.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border bg-white">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-3 text-left">Producto</th>
                                <th className="w-28 p-3 text-left">Cantidad</th>
                                <th className="w-24 p-3"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {visita.productos.map((item) => (
                                <tr key={item.id} className="border-t">
                                  <td className="p-3">
                                    <p className="font-semibold">{item.product}</p>
                                    <p className="text-xs text-gray-500">
                                      {item.codigo || "Sin código"}
                                    </p>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleCantidadChange(
                                          visita.id,
                                          item.id,
                                          parseInt(e.target.value, 10)
                                        )
                                      }
                                      className="w-20 rounded border p-1 text-center"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        eliminarProducto(visita.id, item.id)
                                      }
                                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                      <div className="rounded-xl bg-white p-4">
                        <span className="font-semibold">Cadena:</span>{" "}
                        {visita.cadena || "Sin capturar"}
                      </div>
                      <div className="rounded-xl bg-white p-4">
                        <span className="font-semibold">Tienda:</span>{" "}
                        {tiendaSeleccionada?.name || "Sin capturar"}
                      </div>
                      <div className="rounded-xl bg-white p-4 md:col-span-2">
                        <span className="font-semibold">
                          Productos válidos en esta tienda:
                        </span>{" "}
                        {productosValidos}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Resumen del día
            </h2>

            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <span className="font-semibold">Nombre:</span>{" "}
                {nombre || "Sin capturar"}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <span className="font-semibold">Fecha:</span>{" "}
                {fecha || "Sin capturar"}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <span className="font-semibold">Tiendas capturadas:</span>{" "}
                {visitas.length}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <span className="font-semibold">Productos válidos:</span>{" "}
                {totalProductosValidos}
              </div>

              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                <span className="font-semibold">Observaciones generales:</span>{" "}
                {observacionesGenerales || "Sin capturar"}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGuardarBorrador}
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-black"
              >
                Guardar borrador
              </button>

              <button
                type="button"
                onClick={handleGuardarFirebase}
                disabled={guardandoFirebase}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardandoFirebase ? "Guardando..." : "Guardar en sistema"}
              </button>

              <button
                type="button"
                onClick={handleGenerarPDF}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Generar PDF
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}