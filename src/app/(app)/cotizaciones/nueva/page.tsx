'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { crearCotizacion } from '@/lib/firestore/cotizaciones';
import type { Producto } from '@/lib/firebase-types';
import { Trash2, FileDown, MessageCircle, X } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsapp } from '@/lib/sharePdfWhatsApp';
import { CotizacionPDFData } from '@/lib/pdf/types';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/context/AuthProvider';

interface ProductoConId extends Omit<Producto, 'codigo'> {
  id: string;
  codigo?: string;
}

interface ItemCotizacion extends ProductoConId {
  cantidad: number;
  descuentos: [
    number | undefined,
    number | undefined,
    number | undefined,
    number | undefined
  ];
}

type TipoPago = 'contado' | 'credito' | 'anticipado';

function normalizarDescuentos(
  descuentos: ItemCotizacion['descuentos']
): [number, number, number, number] {
  return [
    descuentos[0] ?? 0,
    descuentos[1] ?? 0,
    descuentos[2] ?? 0,
    descuentos[3] ?? 0,
  ];
}

function calcularTotalesLinea(item: ItemCotizacion) {
  const subtotalLinea = Number(item.precio || 0) * Number(item.cantidad || 0);
  const descuentosNormalizados = normalizarDescuentos(item.descuentos);

  const totalLinea = descuentosNormalizados.reduce<number>(
    (acumulado, descuento) => {
      if (descuento <= 0) return acumulado;
      return acumulado * (1 - descuento / 100);
    },
    subtotalLinea
  );

  const descuentoLinea = subtotalLinea - totalLinea;

  return {
    subtotalLinea,
    totalLinea,
    descuentoLinea,
    descuentosNormalizados,
  };
}

function generarCondiciones(tipo: TipoPago) {
  switch (tipo) {
    case 'contado':
      return `• Precio de contado
• Precios sujetos a disponibilidad`;

    case 'credito':
      return `• Precio bajo esquema de crédito
• Crédito sujeto a autorización
• Precios sujetos a disponibilidad`;

    case 'anticipado':
      return `• Pago anticipado aplica condiciones preferenciales
• Precio especial por pronto pago
• Precios sujetos a disponibilidad`;

    default:
      return '';
  }
}

export default function NuevaCotizacionPage() {
  const { user, loading: authLoading } = useAuth();

  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [vigenciaDias, setVigenciaDias] = useState(7);
  const [tipoPago, setTipoPago] = useState<TipoPago>('contado');
  const [isSharing, setIsSharing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setClientes([]);
      return;
    }

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
  }, [toast, user, authLoading]);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === clienteSeleccionadoId) || null,
    [clientes, clienteSeleccionadoId]
  );

  const clientesFiltrados = useMemo(() => {
    const texto = busquedaCliente.trim().toLowerCase();

    const base = texto
      ? clientes.filter((c) => {
          const nombre = String(c.nombre ?? '').toLowerCase();
          const ciudad = String(c.ciudad ?? '').toLowerCase();
          const telefono = String(c.telefono ?? '').toLowerCase();
          const domicilio = String(c.domicilio ?? '').toLowerCase();

          return (
            nombre.includes(texto) ||
            ciudad.includes(texto) ||
            telefono.includes(texto) ||
            domicilio.includes(texto)
          );
        })
      : clientes;

    return base.slice(0, 12);
  }, [clientes, busquedaCliente]);

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

    setBusqueda('');
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

  const productosFiltrados = busqueda.trim()
    ? productos.filter((p) => {
        const texto = busqueda.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(texto) ||
          String(p.codigo ?? '').toLowerCase().includes(texto)
        );
      })
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
    if (!user) {
      toast({
        title: 'Debes iniciar sesión',
        description: 'No hay sesión activa para guardar la cotización.',
        type: 'error',
      });
      return;
    }

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
          const {
            subtotalLinea,
            descuentoLinea,
            totalLinea,
            descuentosNormalizados,
          } = calcularTotalesLinea(i);

          return {
            productoId: i.id,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: Number(i.precio || 0),
            codigo: i.codigo || '',
            descuentos: descuentosNormalizados,
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
    if (!clienteSeleccionado) {
      return null;
    }

    return {
      cliente: clienteSeleccionado.nombre,
      fecha: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      asesor: user?.displayName || user?.email || 'Asesor Liqui Moly',
      subtotal,
      descuentos: totalDescuentos,
      total,
      observaciones,
      vigenciaDias,
      items: items.map((item) => {
        const { subtotalLinea, totalLinea, descuentosNormalizados } =
          calcularTotalesLinea(item);

        return {
          nombre: item.nombre,
          codigo: item.codigo || '',
          cantidad: item.cantidad,
          precio: Number(item.precio || 0),
          subtotal: subtotalLinea,
          total: totalLinea,
          descuentos: descuentosNormalizados,
        };
      }),
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

    try {
      setIsGeneratingPdf(true);
      const doc = await generarCotizacionPDF(cotizacionParaPDF);
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast({
        title: 'No se pudo generar el PDF',
        description: 'Ocurrió un error al generar la cotización.',
        type: 'error',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
      const doc = await generarCotizacionPDF(cotizacionParaPDF);
      const pdfBlob = doc.output('blob');
      const fileName = `Cotizacion-${cotizacionParaPDF.cliente.replace(/\s/g, '_')}.pdf`;

      const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(cotizacionParaPDF.total);

      const message = `Hola, te comparto la cotización para ${cotizacionParaPDF.cliente} con un total de ${totalFormatted}.`;

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

  if (authLoading) {
    return <div className="space-y-6">Cargando cotización...</div>;
  }

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

            <input
              type="text"
              placeholder="Buscar cliente por nombre, ciudad o teléfono..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 p-3 outline-none"
            />

            {clienteSeleccionado ? (
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-900">
                      {clienteSeleccionado.nombre}
                    </p>
                    <p className="text-sm text-blue-700">
                      {clienteSeleccionado.ciudad || 'Sin ciudad'}
                    </p>
                    {clienteSeleccionado.telefono && (
                      <p className="text-xs text-blue-700">
                        {clienteSeleccionado.telefono}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setClienteSeleccionadoId('');
                      setBusquedaCliente('');
                    }}
                    className="rounded-full p-1 text-blue-700 hover:bg-blue-100"
                    title="Quitar selección"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border bg-white">
                <div className="max-h-72 overflow-y-auto">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClienteSeleccionadoId(c.id || '');
                          setBusquedaCliente(c.nombre || '');
                        }}
                        className="flex w-full items-start justify-between gap-3 border-b p-3 text-left last:border-b-0 hover:bg-blue-50"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">
                            {c.nombre}
                          </p>
                          <p className="text-sm text-slate-500">
                            {c.ciudad || 'Sin ciudad'}
                          </p>
                          {c.telefono && (
                            <p className="text-xs text-slate-500">
                              {c.telefono}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-500">
                      No se encontraron clientes con esa búsqueda.
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              {clienteSeleccionado
                ? 'Cliente seleccionado correctamente.'
                : `${clientesFiltrados.length} cliente${
                    clientesFiltrados.length === 1 ? '' : 's'
                  } mostrado${clientesFiltrados.length === 1 ? '' : 's'}.`}
            </p>
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
                      {String(p.codigo ?? '—')} - ${Number(p.precio || 0).toFixed(2)}
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
              <div className="space-y-4 md:hidden">
                {items.map((item) => {
                  const { subtotalLinea, descuentoLinea, totalLinea } =
                    calcularTotalesLinea(item);

                  return (
                    <div key={item.id} className="rounded-2xl border bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight">{item.nombre}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.codigo || 'Sin código'}
                          </p>
                        </div>

                        <button
                          onClick={() => eliminarItem(item.id)}
                          className="shrink-0 text-red-500 hover:text-red-700"
                          type="button"
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
                            ${Number(item.precio || 0).toFixed(2)}
                          </div>
                        </div>

                        {item.descuentos.map((descuento, index) => (
                          <div key={index}>
                            <p className="mb-1 text-gray-500">
                              Desc. {index + 1} (%)
                            </p>
                            <input
                              type="number"
                              placeholder="0"
                              value={descuento ?? ''}
                              onChange={(e) =>
                                handleDescuentoItemChange(
                                  item.id,
                                  index,
                                  e.target.value
                                )
                              }
                              className="h-10 w-full rounded-xl border bg-white p-2 text-right"
                            />
                          </div>
                        ))}

                        <div>
                          <p className="mb-1 text-gray-500">Subtotal</p>
                          <div className="flex h-10 items-center rounded-xl border bg-white px-3 font-semibold">
                            ${subtotalLinea.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <p className="mb-1 text-gray-500">Descuento</p>
                          <div className="flex h-10 items-center rounded-xl border bg-white px-3 font-semibold text-red-600">
                            -${descuentoLinea.toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <p className="mb-1 text-gray-500">Total línea</p>
                          <div className="flex h-10 items-center rounded-xl border bg-white px-3 font-semibold">
                            ${totalLinea.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Producto</th>
                        <th className="p-3 text-left">Cantidad</th>
                        <th className="p-3 text-left">Precio Unit.</th>
                        <th className="p-3 text-left">Desc. 1</th>
                        <th className="p-3 text-left">Desc. 2</th>
                        <th className="p-3 text-left">Desc. 3</th>
                        <th className="p-3 text-left">Desc. 4</th>
                        <th className="p-3 text-left">Descuento</th>
                        <th className="p-3 text-left">Total</th>
                        <th className="w-12 p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const { descuentoLinea, totalLinea } =
                          calcularTotalesLinea(item);

                        return (
                          <tr key={item.id} className="border-t align-middle">
                            <td className="p-3">
                              <p className="break-words font-semibold">{item.nombre}</p>
                              <p className="text-xs text-gray-500">
                                {item.codigo || 'Sin código'}
                              </p>
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
                              ${Number(item.precio || 0).toFixed(2)}
                            </td>

                            {item.descuentos.map((descuento, index) => (
                              <td key={index} className="p-3">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={descuento ?? ''}
                                  onChange={(e) =>
                                    handleDescuentoItemChange(
                                      item.id,
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="h-10 w-20 rounded-lg border p-2 text-right"
                                />
                              </td>
                            ))}

                            <td className="whitespace-nowrap p-3 font-medium text-red-600">
                              -${descuentoLinea.toFixed(2)}
                            </td>

                            <td className="whitespace-nowrap p-3 font-medium">
                              ${totalLinea.toFixed(2)}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() => eliminarItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                                type="button"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                  htmlFor="tipoPago"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Tipo de condición comercial
                </label>

                <div className="flex gap-2">
                  <select
                    id="tipoPago"
                    value={tipoPago}
                    onChange={(e) => setTipoPago(e.target.value as TipoPago)}
                    className="w-full rounded-xl border bg-white p-3"
                  >
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                    <option value="anticipado">Pago anticipado</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setObservaciones(generarCondiciones(tipoPago))}
                    className="rounded-xl bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="observaciones"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Observaciones
              </label>
              <textarea
                id="observaciones"
                rows={4}
                placeholder="• Precio de contado
• Crédito sujeto a autorización
• Pago anticipado aplica condiciones preferenciales"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              onClick={handleGenerarPDF}
              disabled={items.length === 0 || !clienteSeleccionadoId || isGeneratingPdf}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-500 px-4 py-3 text-white transition-colors hover:bg-gray-600 disabled:bg-gray-400 sm:w-auto"
            >
              <FileDown size={18} />
              {isGeneratingPdf ? 'Generando PDF...' : 'Exportar a PDF'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={items.length === 0 || !clienteSeleccionadoId || isSharing}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700 disabled:bg-gray-400 sm:w-auto"
            >
              <MessageCircle size={18} />
              {isSharing ? 'Compartiendo...' : 'Compartir WhatsApp'}
            </button>

            <button
              onClick={handleGuardarCotizacion}
              disabled={items.length === 0 || !clienteSeleccionadoId || !user}
              type="button"
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