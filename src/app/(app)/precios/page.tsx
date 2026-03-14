'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { Producto } from '@/lib/firebase-types';

interface ProductoConId extends Producto {
  id: string;
}

interface ItemPrecio extends ProductoConId {
  cantidad: number;
}

export default function PreciosPage() {
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [items, setItems] = useState<ItemPrecio[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuentos, setDescuentos] = useState<(number | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  useEffect(() => {
    async function fetchProductos() {
      const snap = await getDocs(collection(db, 'productos'));
      const prods = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ProductoConId)
      );
      setProductos(prods);
    }

    fetchProductos();
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

    setBusqueda('');
  };

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

  const productosFiltrados = busqueda
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

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
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-3xl font-bold">Precios y Descuentos</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Buscar Productos</h2>

            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded border bg-gray-50 p-2"
            />

            {productosFiltrados.length > 0 && (
              <ul className="mt-2 max-h-72 overflow-y-auto rounded border">
                {productosFiltrados.slice(0, 12).map((p) => (
                  <li
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="cursor-pointer border-b p-2 hover:bg-blue-100"
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

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Descuentos</h2>

            <div className="space-y-3">
              {descuentos.map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`desc-${index}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Descuento {index + 1} (%)
                  </label>

                  <input
                    id={`desc-${index}`}
                    type="number"
                    placeholder="0"
                    value={descuentos[index] || ''}
                    onChange={(e) => handleDescuentoChange(index, e.target.value)}
                    className="w-24 rounded border p-2 text-right"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow md:col-span-2">
          <h2 className="mb-4 text-2xl font-bold">Resumen</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">
              Agrega productos para calcular precios con descuentos.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-100">
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
                            <p className="text-xs text-gray-500">{item.codigo}</p>
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
                              className="w-20 rounded border p-1 text-center"
                            />
                          </td>

                          <td className="p-3">${item.precio.toFixed(2)}</td>
                          <td className="p-3 font-medium">${importe.toFixed(2)}</td>
                          <td className="p-3 font-bold text-blue-600">
                            ${neto.toFixed(2)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
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
                    <span className="text-blue-700">${total.toFixed(2)}</span>
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