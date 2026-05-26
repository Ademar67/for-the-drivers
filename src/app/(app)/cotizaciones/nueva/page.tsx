'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { crearCotizacion } from '@/lib/firestore/cotizaciones';
import type { Producto } from '@/lib/firebase-types';
import { Trash2, FileDown, MessageCircle, X, Plus } from 'lucide-react';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import { sharePdfViaWhatsapp } from '@/lib/sharePdfWhatsApp';
import { CotizacionPDFData } from '@/lib/pdf/types';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
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

function calcularTotalesLinea(item: ItemCotizacion) {
  const subtotalLinea = Number(item.precio || 0) * Number(item.cantidad || 0);

  const totalLinea = item.descuentos.reduce<number>(
    (acumulado, descuento) => {
      if (descuento === undefined || descuento <= 0) return acumulado;
      return acumulado * (1 - descuento / 100);
    },
    subtotalLinea
  );

  const descuentoLinea = subtotalLinea - totalLinea;

  return {
    subtotalLinea,
    totalLinea,
    descuentoLinea,
  };
}

function generarCondiciones(tipo: TipoPago) {
  switch (tipo) {
    case 'contado':
      return `• Precio de contado\n• Precios sujetos a disponibilidad`;
    case 'credito':
      return `• Precio bajo esquema de crédito\n• Crédito sujeto a autorización\n• Precios sujetos a disponibilidad`;
    case 'anticipado':
      return `• Pago anticipado aplica condiciones preferenciales\n• Precio especial por pronto pago\n• Precios sujetos a disponibilidad`;
    default:
      return '';
  }
}

export default function NuevaCotizacionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdFromUrl = searchParams.get('clienteId');
  const { toast } = useToast();

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

  useEffect(() => {
    if (!clienteIdFromUrl) return;
    if (clienteSeleccionadoId) return;
    const existeCliente = clientes.some((c) => c.id === clienteIdFromUrl);
    if (existeCliente) {
      setClienteSeleccionadoId(clienteIdFromUrl);
    }
  }, [clienteIdFromUrl, clientes, clienteSeleccionadoId]);

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
          return nombre.includes(texto) || ciudad.includes(texto);
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

  const handleItemDescuentoChange = (id: string, index: number, valor: string) => {
    const val = parseFloat(valor);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nuevos = [...(item.descuentos || [0, 0, 0, 0])] as ItemCotizacion['descuentos'];
        nuevos[index] = isNaN(val) ? 0 : val;
        return { ...item, descuentos: nuevos };
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
    return items.reduce<{ subtotal: number; total: number; totalDescuentos: number }>(
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
      toast({ title: 'Debes iniciar sesión', type: 'error' });
      return;
    }
    if (!clienteSeleccionadoId || items.length === 0) {
      toast({ title: 'Faltan datos', description: 'Selecciona cliente y productos.', type: 'warning' });
      return;
    }
    try {
      const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);
      if (!cliente || !cliente.id) return;

      await crearCotizacion({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        items: items.map((i) => {
          const { subtotalLinea, totalLinea, descuentoLinea } = calcularTotalesLinea(i);
          return {
            productoId: i.id,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: Number(i.precio || 0),
            codigo: i.codigo || '',
            subtotalLinea,
            totalLinea,
            descuentoLinea,
          };
        }),
        subtotal,
        total,
        totalDescuentos,
        observaciones,
        vigenciaDias,
      });

      toast({ title: 'Cotización guardada', type: 'success' });
      router.push('/cotizaciones');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al guardar', type: 'error' });
    }
  };

  const buildCotizacionData = (): CotizacionPDFData | null => {
    if (!clienteSeleccionado) return null;
    return {
      cliente: clienteSeleccionado.nombre,
      fecha: new Date().toLocaleDateString('es-MX'),
      asesor: user?.displayName || user?.email || 'Asesor Liqui Moly',
      subtotal,
      descuentos: totalDescuentos,
      total,
      observaciones,
      vigenciaDias,
      items: items.map((item) => {
        const { totalLinea, subtotalLinea } = calcularTotalesLinea(item);
        return {
          nombre: item.nombre,
          codigo: item.codigo || '',
          cantidad: item.cantidad,
          precio: Number(item.precio || 0),
          total: totalLinea,
          subtotal: subtotalLinea,
        };
      }),
    };
  };

  const handleGenerarPDF = async () => {
    const data = buildCotizacionData();
    if (!data) return;
    try {
      setIsGeneratingPdf(true);
      const doc = await generarCotizacionPDF(data);
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const data = buildCotizacionData();
    if (!data) return;
    try {
      setIsSharing(true);
      const doc = await generarCotizacionPDF(data);
      const pdfBlob = doc.output('blob');
      await sharePdfViaWhatsapp({
        fileName: `Cotizacion-${data.cliente.replace(/\s/g, '_')}.pdf`,
        pdfBlob,
        message: `Hola, te comparto la cotización para ${data.cliente}.`,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSharing(false);
    }
  };

  if (authLoading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cotización</h1>
        <p className="mt-1 text-sm text-gray-500">Selecciona cliente y agrega productos con descuentos.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-lg font-semibold">Cliente</h2>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 p-3 outline-none"
            />
            {clienteSeleccionado ? (
              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-blue-900">{clienteSeleccionado.nombre}</p>
                    <p className="text-sm text-blue-700">{clienteSeleccionado.ciudad}</p>
                  </div>
                  <button onClick={() => setClienteSeleccionadoId('')} className="text-blue-700"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border bg-white">
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setClienteSeleccionadoId(c.id!); setBusquedaCliente(c.nombre); }}
                    className="w-full border-b p-3 text-left last:border-b-0 hover:bg-blue-50"
                  >
                    <p className="font-medium text-sm">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.ciudad}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-lg font-semibold">Buscar Productos</h2>
            <input
              type="text"
              placeholder="Nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 p-3 outline-none"
            />
            {productosFiltrados.length > 0 && (
              <ul className="mt-3 max-h-60 overflow-y-auto rounded-xl border bg-white">
                {productosFiltrados.map((p) => (
                  <li key={p.id} onClick={() => agregarProducto(p)} className="cursor-pointer border-b p-3 hover:bg-blue-50">
                    <p className="text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.codigo} - ${p.precio.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 xl:col-span-2">
          <h2 className="mb-4 text-2xl font-bold">Resumen de Productos</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">Agrega productos para comenzar.</p>
          ) : (
            <div className="space-y-5">
              {/* 📱 MOBILE CARDS */}
              <div className="md:hidden space-y-4">
                {items.map((item) => {
                  const { subtotalLinea, totalLinea } = calcularTotalesLinea(item);
                  return (
                    <div key={item.id} className="rounded-2xl border bg-gray-50 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.nombre}</p>
                          <p className="text-xs text-gray-500">{item.codigo}</p>
                        </div>
                        <button onClick={() => eliminarItem(item.id)} className="text-red-500"><Trash2 size={18} /></button>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleCantidadChange(item.id, parseInt(e.target.value, 10))}
                          className="w-full rounded-xl border p-2 text-center"
                        />
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Precio Unitario</p>
                        <p className="font-semibold">${item.precio.toFixed(2)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            type="number"
                            placeholder={`Desc ${i + 1}`}
                            value={item.descuentos?.[i] ?? ""}
                            onChange={(e) => handleItemDescuentoChange(item.id, i, e.target.value)}
                            className="rounded-lg border p-2 text-center"
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotalLinea.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalLinea.toFixed(2)}</span>
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
                      const { totalLinea } = calcularTotalesLinea(item);
                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <p className="font-semibold text-sm">{item.nombre}</p>
                            <p className="text-xs text-gray-500">{item.codigo}</p>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => handleCantidadChange(item.id, parseInt(e.target.value, 10))}
                              className="w-16 border rounded p-1 text-center"
                            />
                          </td>
                          <td className="p-3 text-sm">${item.precio.toFixed(2)}</td>
                          {[0, 1, 2, 3].map((i) => (
                            <td key={i} className="p-3">
                              <input
                                type="number"
                                value={item.descuentos?.[i] ?? ""}
                                onChange={(e) => handleItemDescuentoChange(item.id, i, e.target.value)}
                                className="w-14 border rounded p-1 text-center text-sm"
                              />
                            </td>
                          ))}
                          <td className="p-3 font-bold text-sm">${totalLinea.toFixed(2)}</td>
                          <td>
                            <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4">
                <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-medium">Total Descuentos</span>
                    <span className="font-bold">-${totalDescuentos.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-black text-blue-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4 border-t pt-6">
            <h3 className="font-bold">Configuración y Observaciones</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Días de vigencia</label>
                <input type="number" value={vigenciaDias} onChange={(e) => setVigenciaDias(parseInt(e.target.value, 10))} className="w-full rounded-xl border p-3" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Condición comercial</label>
                <div className="flex gap-2">
                  <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value as TipoPago)} className="w-full rounded-xl border p-3">
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                    <option value="anticipado">Pago anticipado</option>
                  </select>
                  <Button variant="outline" onClick={() => setObservaciones(generarCondiciones(tipoPago))}>Aplicar</Button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Observaciones</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} className="w-full rounded-xl border p-3" />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleGenerarPDF} disabled={items.length === 0 || isGeneratingPdf}>
              <FileDown className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={handleShareWhatsApp} disabled={items.length === 0 || isSharing} className="border-green-600 text-green-700 hover:bg-green-50">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
            <Button onClick={handleGuardarCotizacion} disabled={items.length === 0 || !clienteSeleccionadoId || !user} className="bg-blue-600 hover:bg-blue-700">
              Guardar Cotización
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
