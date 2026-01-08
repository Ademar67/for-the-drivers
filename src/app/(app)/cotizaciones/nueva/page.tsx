
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { crearCotizacion } from '@/lib/firestore/cotizaciones';
import type { Producto } from '@/lib/firebase-types';
import { Trash2, FileDown } from 'lucide-react';

interface ProductoConId extends Producto {
  id: string;
}

interface ItemCotizacion extends ProductoConId {
  cantidad: number;
}

// NOTE: The jspdf-autotable import style is intentional.
// For more info, see: https://github.com/simonbengtsson/jsPDF-AutoTable/issues/802
declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export default function NuevaCotizacionPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuentos, setDescuentos] = useState<(number | undefined)[]>([undefined, undefined, undefined, undefined]);
  const router = useRouter();

  useEffect(() => {
    const unsub = listenClientes(setClientes);
    async function fetchProductos() {
      const snap = await getDocs(collection(db, 'productos'));
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductoConId));
      setProductos(prods);
    }
    fetchProductos();
    return () => unsub();
  }, []);

  const agregarProducto = (producto: ProductoConId) => {
    setItems(prev => {
      const existente = prev.find(item => item.id === producto.id);
      if (existente) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleCantidadChange = (id: string, cantidad: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, cantidad: Math.max(0, cantidad) } : item));
  }

  const handleDescuentoChange = (index: number, valor: string) => {
    const nuevosDescuentos = [...descuentos];
    const valNum = parseFloat(valor);
    nuevosDescuentos[index] = isNaN(valNum) ? undefined : valNum;
    setDescuentos(nuevosDescuentos);
  };
  
  const productosFiltrados = busqueda ? productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase())) : [];

  const { subtotal, total, totalDescuentos } = items.reduce(
    (acc, item) => {
      const itemTotal = item.precio * item.cantidad;
      let subtotalConDescuentos = itemTotal;

      descuentos.forEach(d => {
        if (d !== undefined && d > 0) {
          subtotalConDescuentos = subtotalConDescuentos * (1 - d / 100);
        }
      });
      
      acc.subtotal += itemTotal;
      acc.total += subtotalConDescuentos;
      acc.totalDescuentos += itemTotal - subtotalConDescuentos;
      
      return acc;
    },
    { subtotal: 0, total: 0, totalDescuentos: 0 }
  );
  
  const handleGuardarCotizacion = async () => {
    if (!clienteSeleccionadoId || items.length === 0) {
      alert("Por favor, selecciona un cliente y agrega al menos un producto.");
      return;
    }
    try {
      const cliente = clientes.find(c => c.id === clienteSeleccionadoId);
      if (!cliente) {
        alert("Cliente no encontrado");
        return;
      }

      await crearCotizacion({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        items: items.map(i => ({ productoId: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, codigo: i.codigo })),
        subtotal,
        descuentos,
        total,
      });
      alert("Cotización guardada con éxito");
      router.push('/cotizaciones');
    } catch (error) {
      console.error("Error al guardar la cotización:", error);
      alert("No se pudo guardar la cotización.");
    }
  };

  const generarPDF = () => {
    const clienteSeleccionado = clientes.find(c => c.id === clienteSeleccionadoId);
    if (!clienteSeleccionado) {
      alert('Por favor, selecciona un cliente para generar el PDF.');
      return;
    }

    const doc = new jsPDF();
  
    // Colores Liqui Moly
    const AZUL = '#0033A0';
    const ROJO = '#E30613';
  
    const marginX = 14;
    let cursorY = 20;
  
    // ─────────────────────────────
    // ENCABEZADO LIQUI MOLY
    // ─────────────────────────────
    doc.setFillColor(AZUL);
    doc.rect(0, 0, 210, 18, 'F');
  
    doc.setFillColor(ROJO);
    doc.rect(0, 18, 210, 4, 'F');
  
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(12);
    doc.text('LIQUI MOLY', marginX, 12);
    doc.setFontSize(8);
    doc.text('FOR THE DRIVERS', marginX, 16);
  
    cursorY = 30;
    doc.setTextColor('#000000');
  
    // ─────────────────────────────
    // DATOS ASESOR
    // ─────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('José Ademar Vázquez', marginX, cursorY);
    cursorY += 5;
  
    doc.setFont('helvetica', 'normal');
    doc.text('ASESOR DE VENTAS', marginX, cursorY);
    cursorY += 5;
  
    doc.text('Tel: (52-55) 5598 1718 | 5598 1719', marginX, cursorY);
    cursorY += 5;
  
    doc.text('Cel: 44 3618 8484', marginX, cursorY);
    cursorY += 5;
  
    doc.text('Email: ademar.vazquez@liqui-moly.mx', marginX, cursorY);
    cursorY += 8;
  
    // ─────────────────────────────
    // DATOS CLIENTE + FECHAS
    // ─────────────────────────────
    const fechaEmision = new Date();
    const vigenciaDias = 7;
    const fechaVigencia = new Date(fechaEmision);
    fechaVigencia.setDate(fechaVigencia.getDate() + vigenciaDias);
  
    doc.setFont('helvetica', 'bold');
    doc.text('Cotización', 150, 30);
  
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha emisión: ${fechaEmision.toLocaleDateString()}`, 150, 36);
    doc.text(`Vigencia hasta: ${fechaVigencia.toLocaleDateString()}`, 150, 42);
  
    cursorY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`Cliente: ${clienteSeleccionado?.nombre || ''}`, marginX, cursorY);
    cursorY += 5;
  
    doc.setFont('helvetica', 'normal');
    doc.text(`Dirección: ${clienteSeleccionado?.domicilio || ''}`, marginX, cursorY);
    cursorY += 10;
  
    // ─────────────────────────────
    // TABLA PRODUCTOS
    // ─────────────────────────────
    autoTable(doc, {
      startY: cursorY,
      head: [['Código', 'Producto', 'Cantidad', 'Precio Unit.', 'Total']],
      body: items.map((p) => [
        p.codigo,
        p.nombre,
        p.cantidad.toString(),
        `$${p.precio.toFixed(2)}`,
        `$${(p.cantidad * p.precio).toFixed(2)}`
      ]),
      headStyles: {
        fillColor: AZUL,
        textColor: '#FFFFFF',
      },
      styles: {
        fontSize: 9,
      },
    });
  
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  
    // ─────────────────────────────
    // TOTALES
    // ─────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, cursorY);
    cursorY += 5;
  
    doc.text(`Total descuentos: -$${totalDescuentos.toFixed(2)}`, 140, cursorY);
    cursorY += 6;
  
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ROJO);
    doc.text(`TOTAL: $${total.toFixed(2)}`, 140, cursorY);
    doc.setTextColor('#000000');
  
    cursorY += 12;
  
    // ─────────────────────────────
    // OBSERVACIONES
    // ─────────────────────────────
    doc.setDrawColor(AZUL);
    doc.rect(marginX, cursorY, 182, 22);
  
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', marginX + 2, cursorY + 6);
  
    doc.setFont('helvetica', 'normal');
    const observaciones = '';
    const obsTexto =
      observaciones?.trim() ||
      '• Se acepta pago con terminal bancaria.\n• Precios sujetos a disponibilidad.\n• Tiempo de entrega estimado: 24 a 48 hrs.';
  
    doc.text(obsTexto, marginX + 2, cursorY + 12);
  
    // ─────────────────────────────
    // GUARDAR
    // ─────────────────────────────
    doc.save(`cotizacion-${clienteSeleccionado?.nombre || 'cliente'}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Nueva Cotización</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Cliente y Productos */}
        <div className="md:col-span-1 space-y-6">
          {/* Cliente */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Cliente</h2>
            <select
              value={clienteSeleccionadoId}
              onChange={e => setClienteSeleccionadoId(e.target.value)}
              className="w-full border p-2 rounded bg-gray-50"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Buscador de Productos */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Buscar Productos</h2>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border p-2 rounded bg-gray-50"
            />
            {productosFiltrados.length > 0 && (
              <ul className="mt-2 border rounded max-h-60 overflow-y-auto">
                {productosFiltrados.slice(0, 10).map(p => (
                  <li key={p.id} onClick={() => agregarProducto(p)} className="p-2 hover:bg-blue-100 cursor-pointer border-b">
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-sm text-gray-500">{p.codigo} - ${p.precio.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen de Cotización */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Resumen</h2>
          
          {items.length === 0 ? (
            <p className="text-gray-500">Agrega productos para comenzar.</p>
          ) : (
            <div className="space-y-4">
              {/* Tabla de items */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Producto</th>
                      <th className="p-3 text-left w-24">Cantidad</th>
                      <th className="p-3 text-left w-32">Precio Unit.</th>
                      <th className="p-3 text-left w-32">Total</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <p className="font-semibold">{item.nombre}</p>
                          <p className="text-xs text-gray-500">{item.codigo}</p>
                        </td>
                        <td className="p-3">
                          <input type="number" value={item.cantidad} onChange={e => handleCantidadChange(item.id, parseInt(e.target.value, 10))} className="w-20 border rounded p-1 text-center" />
                        </td>
                        <td className="p-3">${item.precio.toFixed(2)}</td>
                        <td className="p-3 font-medium">${(item.precio * item.cantidad).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Descuentos y Totales */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  {descuentos.map((_, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <label htmlFor={`desc-${index}`} className="text-sm text-gray-600">Descuento {index + 1} (%)</label>
                      <input
                        id={`desc-${index}`}
                        type="number"
                        placeholder="0"
                        value={descuentos[index] || ''}
                        onChange={e => handleDescuentoChange(index, e.target.value)}
                        className="w-20 border rounded p-1 text-right"
                      />
                    </div>
                  ))}

                   <div className="flex justify-between items-center text-red-600">
                    <span className="font-semibold">Total Descuentos</span>
                    <span className="font-semibold">-${totalDescuentos.toFixed(2)}</span>
                  </div>

                  <div className="border-t my-2"></div>
                  
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => generarPDF()}
              disabled={items.length === 0 || !clienteSeleccionadoId}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <FileDown size={18} />
              Exportar a PDF
            </button>
            <button
              onClick={handleGuardarCotizacion}
              disabled={items.length === 0 || !clienteSeleccionadoId}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              Guardar Cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
