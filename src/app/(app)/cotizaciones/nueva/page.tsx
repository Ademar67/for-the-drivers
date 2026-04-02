'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useToast } from '@/components/ui/toast-provider';

interface ProductoConId extends Producto {
  id: string;
  codigo?: string;
}

interface ItemCotizacion extends ProductoConId {
  cantidad: number;
  descuentos: [number | undefined, number | undefined, number | undefined, number | undefined];
}

function calcularTotalesLinea(item: ItemCotizacion) {
  const subtotalLinea = item.precio * item.cantidad;

  const totalLinea = item.descuentos.reduce((acumulado, descuento) => {
    if (descuento === undefined || descuento <= 0) return acumulado;
    return acumulado * (1 - descuento / 100);
  }, subtotalLinea);

  const descuentoLinea = subtotalLinea - totalLinea;

  return {
    subtotalLinea,
    totalLinea,
    descuentoLinea,
  };
}

export default function NuevaCotizacionPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [vigenciaDias, setVigenciaDias] = useState(7);
  const [isSharing, setIsSharing] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsub = listenClientes(setClientes);

    async function fetchProductos() {
      try {
        const snap = await getDocs(collection(db, 'productos'));
        const prods = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ProductoConId)
        );
        setProductos(prods);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        toast({
          title: 'No se pudieron cargar los productos',
          description: 'Intenta recargar la página.',
          type: 'error',
        });
      }
    }

    fetchProductos();
    return () => unsub();
  }, [toast]);

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

      return [
        ...prev,
        {
          ...producto,
          cantidad: 1,
          descuentos: [undefined, undefined, undefined, undefined],
        },
      ];
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

  const handleDescuentoItemChange = (
    itemId: string,
    index: number,
    valor: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const nuevosDescuentos = [...item.descuentos] as ItemCotizacion['descuentos'];
        const valNum = parseFloat(valor);
        nuevosDescuentos[index] = Number.isNaN(valNum) ? undefined : valNum;

        return {
          ...item,
          descuentos: nuevosDescuentos,
        };
      })
    );
  };

  const productosFiltrados = busqueda
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          String(p.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

  const { subtotal, total, totalDescuentos } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const { subtotalLinea, totalLinea, descuentoLinea } =
          calcularTotalesLinea(item);

        acc.subtotal += subtotalLinea;
        acc.total += totalLinea;
        acc.totalDescuentos += descuentoLinea;

        return acc;
      },
      { subtotal: 0, total: 0, totalDescuentos: 0 }
    );
  }, [items]);

  const handleGuardarCotizacion = async () => {
    if (!clienteSeleccionadoId || items.length === 0) {
      toast({
        title: 'Faltan datos',
        description: 'Selecciona un cliente y agrega al menos un producto.',
        type: 'warning',
      });
      return;
    }

    try {
      const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);

      if (!cliente) {
        toast({
          title: 'Cliente no encontrado',
          description: 'Selecciona un cliente válido.',
          type: 'error',
        });
        return;
      }

      if (!cliente.id) {
        toast({
          title: 'Cliente inválido',
          description: 'El cliente no tiene un ID válido.',
          type: 'error',
        });
        return;
      }

      await crearCotizacion({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        items: items.map((i) => {
          const { subtotalLinea, descuentoLinea, totalLinea } =
            calcularTotalesLinea(i);

          return {
            productoId: i.id,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: i.precio,
            codigo: i.codigo,
            descuentos: i.descuentos,
            subtotalLinea,
            descuentoLinea,
            totalLinea,
          };
        }),
        subtotal,
        total,
        totalDescuentos,
        observaciones,
        vigenciaDias,
      });

      toast({
        title: 'Cotización guardada',
        description: 'La cotización se guardó con éxito.',
        type: 'success',
      });

      router.push('/cotizaciones');
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      toast({
        title: 'No se pudo guardar',
        description: 'Ocurrió un problema al guardar la cotización.',
        type: 'error',
      });
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
      items: items.map((item) => {
        const { subtotalLinea, descuentoLinea, totalLinea } =
          calcularTotalesLinea(item);

        return {
          ...item,
          subtotalLinea,
          descuentoLinea,
          totalLinea,
        };
      }),
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
      toast({
        title: 'Falta cliente',
        description: 'Selecciona un cliente para generar el PDF.',
        type: 'warning',
      });
      return;
    }

    const blob = await generarCotizacionPDF(cotizacionParaPDF);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = async () => {
    const cotizacionParaPDF = buildCotizacionData();

    if (!cotizacionParaPDF) {
      toast({
        title: 'Falta cliente',
        description: 'Selecciona un cliente para compartir la cotización.',
        type: 'warning',
      });
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
      toast({
        title: 'No se pudo compartir',
        description: 'Ocurrió un error al intentar compartir la cotización.',
        type: 'error',
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cotización</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selecciona cliente, agrega productos y asigna descuentos por producto.
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
                      {String(p.codigo ?? '—')} - ${p.precio.toFixed(2)}
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
              {/* 📱 MOBILE CARDS */}
              <div className="md:hidden space-y-4">
                {items.map((item) => {
                  const itemSubtotal = item.precio * item.cantidad;

                  const itemTotal =
                    item.descuentos?.reduce((acc: number, d: number | undefined) => {
                      if (d === undefined || d <= 0) return acc;
                      return acc * (1 - d / 100);
                    }, itemSubtotal) ?? itemSubtotal;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-gray-50 p-4 space-y-3"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.nombre}</p>
                          <p className="text-xs text-gray-500">{item.codigo}</p>
                        </div>

                        <button
                          onClick={() => eliminarItem(item.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Cantidad */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleCantidadChange(item.id, parseInt(e.target.value, 10))
                          }
                          className="w-full rounded-xl border p-2 text-center"
                        />
                      </div>

                      {/* Precio */}
                      <div className="text-sm">
                        <p className="text-gray-500">Precio Unitario</p>
                        <p className="font-semibold">${item.precio.toFixed(2)}</p>
                      </div>

                      {/* Descuentos */}
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            type="number"
                            placeholder={`Desc ${i + 1}`}
                            value={item.descuentos?.[i] ?? ''}
                            onChange={(e) =>
                              handleDescuentoItemChange(item.id, i, e.target.value)
                            }
                            className="rounded-lg border p-2 text-center"
                          />
                        ))}
                      </div>

                      {/* Totales */}
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${itemSubtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${itemTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 💻 DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Producto</th>
                      <th className="p-3 text-left">Cant.</th>
                      <th className="p-3 text-left">Precio</th>
                      <th className="p-3 text-left">D1</th>
                      <th className="p-3 text-left">D2</th>
                      <th className="p-3 text-left">D3</th>
                      <th className="p-3 text-left">D4</th>
                      <th className="p-3 text-left">Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => {
                      const itemSubtotal = item.precio * item.cantidad;

                      const itemTotal =
                        item.descuentos?.reduce((acc: number, d: number | undefined) => {
                          if (d === undefined || d <= 0) return acc;
                          return acc * (1 - d / 100);
                        }, itemSubtotal) ?? itemSubtotal;

                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <p className="font-semibold">{item.nombre}</p>
                            <p className="text-xs text-gray-500">{item.codigo}</p>
                          </td>

                          <td className="p-3">
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleCantidadChange(
                                  item.id,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-16 border rounded text-center"
                            />
                          </td>

                          <td className="p-3">${item.precio.toFixed(2)}</td>

                          {[0, 1, 2, 3].map((i) => (
                            <td key={i} className="p-3">
                              <input
                                type="number"
                                value={item.descuentos?.[i] ?? ''}
                                onChange={(e) =>
                                  handleDescuentoItemChange(
                                    item.id,
                                    i,
                                    e.target.value
                                  )
                                }
                                className="w-16 border rounded text-center"
                              />
                            </td>
                          ))}

                          <td className="p-3 font-bold">
                            ${itemTotal.toFixed(2)}
                          </td>

                          <td>
                            <button onClick={() => eliminarItem(item.id)}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-3 rounded-2xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

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
