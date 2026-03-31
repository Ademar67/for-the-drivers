'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { crearCotizacion } from '@/lib/firestore/cotizaciones';
import type { Producto } from '@/lib/firebase-types';
import { Trash2, FileDown, MessageCircle } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsapp } from '@/lib/sharePdfWhatsApp';
import { CotizacionPDFData } from '@/lib/pdf/types';

interface ProductoConId extends Producto {
  id: string;
}

interface ItemCotizacion extends ProductoConId {
  cantidad: number;
}

export default function NuevaCotizacionPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuentos, setDescuentos] = useState<(number | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [observaciones, setObservaciones] = useState('');
  const [vigenciaDias, setVigenciaDias] = useState(7);
  const [isSharing, setIsSharing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = listenClientes(setClientes);

    async function fetchProductos() {
      const snap = await getDocs(collection(db, 'productos'));
      const prods = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ProductoConId)
      );
      setProductos(prods);
    }

    fetchProductos();
    return () => unsub();
  }, []);

  const agregarProducto = (producto: ProductoConId) => {
    setItems((prev) => {
      const existente = prev.find((item) => item.id === producto.id);
      if (existente) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidad: Math.max(0, cantidad || 0) } : item
      )
    );
  };

  const handleDescuentoChange = (index: number, valor: string) => {
    const nuevosDescuentos = [...descuentos];
    const valNum = parseFloat(valor);
    nuevosDescuentos[index] = isNaN(valNum) ? undefined : valNum;
    setDescuentos(nuevosDescuentos);
  };

  const productosFiltrados = busqueda
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

  const { subtotal, total, totalDescuentos } = items.reduce(
    (acc, item) => {
      const itemSubtotal = item.precio * item.cantidad;
      acc.subtotal += itemSubtotal;

      const itemTotalConDescuentos = descuentos.reduce<number>(
        (currentPrice, d) => {
          if (d !== undefined && d > 0) {
            return currentPrice * (1 - d / 100);
          }
          return currentPrice;
        },
        itemSubtotal
      );

      acc.total += itemTotalConDescuentos;
      acc.totalDescuentos += itemSubtotal - itemTotalConDescuentos;

      return acc;
    },
    { subtotal: 0, total: 0, totalDescuentos: 0 }
  );

  const handleGuardarCotizacion = async () => {
    if (!clienteSeleccionadoId || items.length === 0) {
      alert('Por favor, selecciona un cliente y agrega al menos un producto.');
      return;
    }

    try {
      const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);

      if (!cliente) {
        alert('Cliente no encontrado');
        return;
      }

      if (!cliente.id) {
        alert('Error: el cliente no tiene un ID válido.');
        return;
      }

      await crearCotizacion({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        items: items.map((i) => ({
          productoId: i.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio,
          codigo: i.codigo,
        })),
        subtotal,
        descuentos,
        total,
        totalDescuentos,
        observaciones,
        vigenciaDias,
      });

      alert('Cotización guardada con éxito');
      router.push('/cotizaciones');
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      alert('No se pudo guardar la cotización.');
    }
  };

  const buildCotizacionData = (): CotizacionPDFData | null => {
    const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);

    if (!cliente) {
      return null;
    }

    return {
      id: 'NUEVA',
      clienteNombre: cliente.nombre,
      clienteDireccion: cliente.domicilio,
      items: items.map((item) => ({ ...item })),
      subtotal,
      total,
      totalDescuentos,
      observaciones,
      vigenciaDias,
    };
  };

  const handleGenerarPDF = async () => {
    const cotizacionParaPDF = buildCotizacionData();

    if (!cotizacionParaPDF) {
      alert('Por favor, selecciona un cliente para generar el PDF.');
      return;
    }

    const blob = await generarCotizacionPDF(cotizacionParaPDF);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = async () => {
    const cotizacionParaPDF = buildCotizacionData();

    if (!cotizacionParaPDF) {
      alert('Por favor, selecciona un cliente para compartir la cotización.');
      return;
    }

    setIsSharing(true);

    try {
      const pdfBlob = await generarCotizacionPDF(cotizacionParaPDF);
      const fileName = `Cotizacion-${cotizacionParaPDF.clienteNombre.replace(/\s/g, '_')}.pdf`;

      const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(cotizacionParaPDF.total);

      const message = `Hola, te comparto la cotización para ${cotizacionParaPDF.clienteNombre} con un total de ${totalFormatted}.`;

      await sharePdfViaWhatsapp({
        fileName,
        pdfBlob,
        message,
      });
    } catch (error) {
      console.error('Error al compartir por WhatsApp:', error);
      alert('Ocurrió un error al intentar compartir la cotización.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cotización</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selecciona cliente, agrega productos y genera la cotización.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold">Cliente</h2>
            <select
              value={clienteSeleccionadoId}
              onChange={(e) => setClienteSeleccionadoId(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 p-3 outline-none"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold">Buscar Productos</h2>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 p-3 outline-none"
            />

            {productosFiltrados.length > 0 && (
              <ul className="mt-3 max-h-72 overflow-y-auto rounded-xl border bg-white">
                {productosFiltrados.slice(0, 10).map((p) => (
                  <li
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-blue-50"
                  >
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {p.codigo} - ${p.precio.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6 xl:col-span-2">
          <h2 className="mb-4 text-2xl font-bold">Resumen</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">Agrega productos para comenzar.</p>
          ) : (
            <div className="space-y-5">
              {/* Vista móvil en tarjetas */}
              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">{item.nombre}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.codigo}</p>
                      </div>

                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="mb-1 text-gray-500">Cantidad</p>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={item.cantidad}
                          onChange={(e) =>
                            handleCantidadChange(
                              item.id,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="h-10 w-full rounded-xl border bg-white p-2 text-center"
                        />
                      </div>

                      <div>
                        <p className="mb-1 text-gray-500">Precio unitario</p>
                        <div className="flex h-10 items-center rounded-xl border bg-white px-3">
                          ${item.precio.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <p className="mb-1 text-gray-500">Total</p>
                        <div className="flex h-10 items-center rounded-xl border bg-white px-3 font-semibold">
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista desktop tabla */}
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="min-w-[260px] p-3 text-left">Producto</th>
                        <th className="min-w-[120px] p-3 text-left">Cantidad</th>
                        <th className="min-w-[130px] p-3 text-left">Precio Unit.</th>
                        <th className="min-w-[120px] p-3 text-left">Total</th>
                        <th className="w-12 p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t align-middle">
                          <td className="p-3">
                            <p className="break-words font-semibold">{item.nombre}</p>
                            <p className="text-xs text-gray-500">{item.codigo}</p>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={item.cantidad}
                              onChange={(e) =>
                                handleCantidadChange(
                                  item.id,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="h-10 w-24 rounded-lg border p-2 text-center"
                            />
                          </td>
                          <td className="whitespace-nowrap p-3">
                            ${item.precio.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap p-3 font-medium">
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => eliminarItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-3 rounded-2xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  {descuentos.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3"
                    >
                      <label
                        htmlFor={`desc-${index}`}
                        className="text-sm text-gray-600"
                      >
                        Descuento {index + 1} (%)
                      </label>
                      <input
                        id={`desc-${index}`}
                        type="number"
                        placeholder="0"
                        value={descuentos[index] || ''}
                        onChange={(e) => handleDescuentoChange(index, e.target.value)}
                        className="h-10 w-24 rounded-lg border p-2 text-right"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-red-600">
                    <span className="font-semibold">Total Descuentos</span>
                    <span className="font-semibold">
                      -${totalDescuentos.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 border-t pt-6">
            <h3 className="mb-3 text-lg font-semibold">Configuración del PDF</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="vigencia"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Días de vigencia
                </label>
                <input
                  type="number"
                  id="vigencia"
                  value={vigenciaDias}
                  onChange={(e) => setVigenciaDias(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label
                  htmlFor="observaciones"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  rows={4}
                  placeholder="• Se acepta pago con terminal bancaria..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full rounded-xl border p-3"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={handleGenerarPDF}
              disabled={items.length === 0 || !clienteSeleccionadoId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-500 px-4 py-3 text-white transition-colors hover:bg-gray-600 disabled:bg-gray-400 sm:w-auto"
            >
              <FileDown size={18} />
              Exportar a PDF
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={items.length === 0 || !clienteSeleccionadoId || isSharing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700 disabled:bg-gray-400 sm:w-auto"
            >
              <MessageCircle size={18} />
              {isSharing ? 'Compartiendo...' : 'Compartir WhatsApp'}
            </button>

            <button
              onClick={handleGuardarCotizacion}
              disabled={items.length === 0 || !clienteSeleccionadoId}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 sm:w-auto"
            >
              Guardar Cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
