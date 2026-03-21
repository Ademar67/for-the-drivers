"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { stores } from "@/lib/stores";

type ChainOption = "AutoZone" | "OReilly" | "Liverpool" | "";

type ProductRow = {
  id: string;
  product: string;
  quantity: number | "";
};

type VisitRow = {
  id: string;
  cadena: ChainOption;
  tiendaId: string;
  observaciones: string;
  productos: ProductRow[];
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

function createProductRow(): ProductRow {
  return {
    id: createId(),
    product: "",
    quantity: "",
  };
}

function createVisitRow(): VisitRow {
  return {
    id: createId(),
    cadena: "",
    tiendaId: "",
    observaciones: "",
    productos: [createProductRow()],
  };
}

export default function InventarioPage() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(formatToday());
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [visitas, setVisitas] = useState<VisitRow[]>([createVisitRow()]);

  const totalProductosValidos = useMemo(() => {
    return visitas.reduce((acc, visita) => {
      const validos = visita.productos.filter(
        (item) => item.product.trim() !== "" && item.quantity !== ""
      ).length;

      return acc + validos;
    }, 0);
  }, [visitas]);

  function agregarVisita() {
    setVisitas((prev) => [...prev, createVisitRow()]);
  }

  function eliminarVisita(visitId: string) {
    setVisitas((prev) => prev.filter((visita) => visita.id !== visitId));
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

  function agregarProducto(visitId: string) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        return {
          ...visita,
          productos: [...visita.productos, createProductRow()],
        };
      })
    );
  }

  function eliminarProducto(visitId: string, productId: string) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        const nuevosProductos = visita.productos.filter(
          (item) => item.id !== productId
        );

        return {
          ...visita,
          productos:
            nuevosProductos.length > 0 ? nuevosProductos : [createProductRow()],
        };
      })
    );
  }

  function actualizarProducto(
    visitId: string,
    productId: string,
    field: "product" | "quantity",
    value: string
  ) {
    setVisitas((prev) =>
      prev.map((visita) => {
        if (visita.id !== visitId) return visita;

        return {
          ...visita,
          productos: visita.productos.map((item) => {
            if (item.id !== productId) return item;

            if (field === "quantity") {
              return {
                ...item,
                quantity: value === "" ? "" : Number(value),
              };
            }

            return {
              ...item,
              product: value,
            };
          }),
        };
      })
    );
  }

  function construirInventario() {
    return {
      nombre: nombre.trim(),
      fecha,
      observacionesGenerales: observacionesGenerales.trim(),
      visitas: visitas
        .map((visita) => {
          const tienda = stores.find((store) => store.id === visita.tiendaId);

          return {
            ...visita,
            tiendaNombre: tienda?.name || "",
            ciudad: tienda?.city || "",
            estado: tienda?.state || "",
            productos: visita.productos.filter(
              (item) => item.product.trim() !== "" && item.quantity !== ""
            ),
          };
        })
        .filter(
          (visita) =>
            visita.cadena &&
            visita.tiendaId &&
            visita.productos.length > 0
        ),
    };
  }

  function handleGuardarBorrador() {
    const inventario = construirInventario();
    localStorage.setItem("inventario-diario-borrador", JSON.stringify(inventario));
    alert("Inventario diario guardado temporalmente en este dispositivo.");
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
        `Observaciones: ${
          visita.observaciones?.trim() || "Sin observaciones"
        }`,
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
          producto.product,
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

      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY
        ? ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
            .finalY + 10)
        : y + 10;
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
                  (item) => item.product.trim() !== "" && item.quantity !== ""
                ).length;

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
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            Productos de esta tienda
                          </h4>
                          <p className="text-sm text-gray-600">
                            Agrega producto y cantidad encontrada.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => agregarProducto(visita.id)}
                          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                        >
                          + Agregar producto
                        </button>
                      </div>

                      <div className="space-y-3">
                        {visita.productos.map((item, productIndex) => (
                          <div
                            key={item.id}
                            className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_180px_140px]"
                          >
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Producto #{productIndex + 1}
                              </label>
                              <input
                                type="text"
                                value={item.product}
                                onChange={(e) =>
                                  actualizarProducto(
                                    visita.id,
                                    item.id,
                                    "product",
                                    e.target.value
                                  )
                                }
                                placeholder="Ej. Molygen 5W-30"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Cantidad
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) =>
                                  actualizarProducto(
                                    visita.id,
                                    item.id,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => eliminarProducto(visita.id, item.id)}
                                className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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