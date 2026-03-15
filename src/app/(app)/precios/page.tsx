'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Trash2, Search, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import type { Producto } from '@/lib/firebase-types';

interface ProductoConId extends Producto {
  id: string;
}

interface ItemPrecio extends ProductoConId {
  cantidad: number;
}

export default function PreciosPage() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';

  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [items, setItems] = useState<ItemPrecio[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuentos, setDescuentos] = useState<(number | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    async function fetchProductos() {
      try {
        const snap = await getDocs(collection(db, 'productos'));
        const prods = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ProductoConId)
        );
        setProductos(prods);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoadingProductos(false);
      }
    }

    fetchProductos();
  }, []);

  useEffect(() => {
    if (searchFromUrl) {
      setBusqueda(searchFromUrl);
    }
  }, [searchFromUrl]);

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

    setBusqueda('');
  };

  useEffect(() => {
    if (!searchFromUrl || productos.length === 0) return;

    const termino = searchFromUrl.trim().toLowerCase();
    if (!termino) return;

    const exacto = productos.find(
      (p) =>
        p.nombre?.trim().toLowerCase() === termino ||
        p.codigo?.trim().toLowerCase() === termino
    );

    if (!exacto) return;

    setItems((prev) => {
      const existe = prev.some((item) => item.id === exacto.id);
      if (existe) return prev;
      return [...prev, { ...exacto, cantidad: 1 }];
    });
  }, [searchFromUrl, productos]);

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidad: Math.max(1, cantidad || 1) } : item
      )
    );
  };

  const handleDescuentoChange = (index: number, valor: string) => {
    const nuevosDescuentos = [...descuentos];
    const valNum = parseFloat(valor);
    nuevosDescuentos[index] = isNaN(valNum) ? undefined : valNum;
    setDescuentos(nuevosDescuentos);
  };

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return [];

    const termino = busqueda.toLowerCase();

    return productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(termino) ||
        p.codigo?.toLowerCase().includes(termino)
    );
  }, [busqueda, productos]);

  const calcularTotalConDescuentos = (importeBase: number) => {
    return descuentos.reduce<number>((currentPrice, d) => {
      if (d !== undefined && d > 0) {
        return currentPrice * (1 - d / 100);
      }
      return currentPrice;
    }, importeBase);
  };

  const { subtotal, total, totalDescuentos } = items.reduce(
    (acc, item) => {
      const itemSubtotal = item.precio * item.cantidad;
      const itemTotalConDescuentos = calcularTotalConDescuentos(itemSubtotal);

      acc.subtotal += itemSubtotal;
      acc.total += itemTotalConDescuentos;
      acc.totalDescuentos += itemSubtotal - itemTotalConDescuentos;

      return acc;
    },
    { subtotal: 0, total: 0, totalDescuentos: 0 }
  );

  return (
    <div className="min-h-screen space-y-6 bg-background p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Precios y Descuentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca productos, agrégalos al resumen y calcula descuentos en segundos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Search className="h-5 w-5" />
              Buscar Productos
            </h2>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border bg-background py-2 pl-10 pr-3 outline-none transition focus:border-primary"
              />
            </div>

            {searchFromUrl && (
              <p className="mt-2 text-xs text-muted-foreground">
                Búsqueda recibida desde el dashboard: <span className="font-medium">"{searchFromUrl}"</span>
              </p>
            )}

            {loadingProductos ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Cargando productos...
              </p>
            ) : productosFiltrados.length > 0 ? (
              <ul className="mt-3 max-h-72 overflow-y-auto rounded-xl border">
                {productosFiltrados.slice(0, 12).map((p) => (
                  <li
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="cursor-pointer border-b p-3 transition hover:bg-muted"
                  >
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.codigo} - ${p.precio.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : busqueda.trim() ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No se encontraron productos con esa búsqueda.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Descuentos</h2>

            <div className="space-y-3">
              {descuentos.map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`desc-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Descuento {index + 1} (%)
                  </label>

                  <input
                    id={`desc-${index}`}
                    type="number"
                    placeholder="0"
                    value={descuentos[index] || ''}
                    onChange={(e) => handleDescuentoChange(index, e.target.value)}
                    className="w-24 rounded-xl border bg-background p-2 text-right outline-none transition focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm md:col-span-2">
          <h2 className="mb-4 text-2xl font-bold">Resumen</h2>

          {items.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Todavía no hay productos agregados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca un producto y selecciónalo para calcular su precio.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border">
                <table className="w-full">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="p-3 text-left">Producto</th>
                      <th className="w-24 p-3 text-left">Cantidad</th>
                      <th className="w-32 p-3 text-left">Precio Unit.</th>
                      <th className="w-32 p-3 text-left">Importe</th>
                      <th className="w-32 p-3 text-left">Neto</th>
                      <th className="w-12 p-3"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => {
                      const importe = item.precio * item.cantidad;
                      const neto = calcularTotalConDescuentos(importe);

                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <p className="font-semibold">{item.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.codigo}
                            </p>
                          </td>

                          <td className="p-3">
                            <input
                              type="number"
                              value={item.cantidad}
                              min={1}
                              onChange={(e) =>
                                handleCantidadChange(
                                  item.id,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-20 rounded-xl border bg-background p-1 text-center outline-none transition focus:border-primary"
                            />
                          </td>

                          <td className="p-3">${item.precio.toFixed(2)}</td>
                          <td className="p-3 font-medium">${importe.toFixed(2)}</td>
                          <td className="p-3 font-bold text-primary">
                            ${neto.toFixed(2)}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => eliminarItem(item.id)}
                              className="text-red-500 transition hover:text-red-700"
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

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-background p-4">
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

                  <div className="my-2 border-t"></div>

                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}