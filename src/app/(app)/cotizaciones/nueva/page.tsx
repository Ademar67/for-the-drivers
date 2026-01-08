
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

  const generarPDF = (vigenciaDias = 8, observaciones = '') => {
    const cliente = clientes.find(c => c.id === clienteSeleccionadoId);
    if (!cliente) {
      alert('Selecciona un cliente primero.');
      return;
    }
  
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
  
    // ---------------------------------------------------------------------------
    // COLORES LIQUI MOLY
    // ---------------------------------------------------------------------------
    const azul: [number, number, number] = [0, 56, 168];
    const rojo: [number, number, number] = [227, 6, 19];
  
    // ---------------------------------------------------------------------------
    // HEADER (FRANJAS + LOGO TEXTO)
    // ---------------------------------------------------------------------------
    doc.setFillColor(...azul);
    doc.rect(0, 0, pageWidth, 18, 'F');
  
    doc.setFillColor(...rojo);
    doc.rect(0, 18, pageWidth, 4, 'F');
  
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LIQUI MOLY', 14, 12);
  
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FOR THE DRIVERS', 14, 17);
  
    // ---------------------------------------------------------------------------
    // TÍTULO
    // ---------------------------------------------------------------------------
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Cotización', pageWidth - 14, 34, { align: 'right' });
  
    // ---------------------------------------------------------------------------
    // DATOS DEL ASESOR (ARRIBA)
    // ---------------------------------------------------------------------------
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
  
    let headerY = 42;
  
    doc.text('José Ademar Vázquez', 14, headerY);
    doc.setFont('helvetica', 'normal');
    doc.text('ASESOR DE VENTAS', 14, headerY + 5);
  
    doc.text('Tel: (52-55) 5598 1718 | 5598 1719', 14, headerY + 12);
    doc.text('Cel: 44 3618 8484', 14, headerY + 17);
    doc.text('Email: ademar.vazquez@liqui-moly.mx', 14, headerY + 22);
  
    // ---------------------------------------------------------------------------
    // DATOS CLIENTE Y FECHAS
    // ---------------------------------------------------------------------------
    const fechaEmision = new Date();
    const fechaVigencia = new Date();
    fechaVigencia.setDate(fechaEmision.getDate() + vigenciaDias);
  
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  
    let clienteY = 70;
    doc.text('Cliente:', 14, clienteY);
    doc.setFont('helvetica', 'bold');
    doc.text(cliente.nombre, 32, clienteY);
  
    doc.setFont('helvetica', 'normal');
    doc.text('Dirección:', 14, clienteY + 6);
    doc.text(cliente.domicilio || '—', 32, clienteY + 6);
  
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  
    doc.text(`Fecha emisión: ${fechaEmision.toLocaleDateString()}`, pageWidth - 14, 46, { align: 'right' });
    doc.text(`Vigencia hasta: ${fechaVigencia.toLocaleDateString()}`, pageWidth - 14, 52, { align: 'right' });
  
    // ---------------------------------------------------------------------------
    // TABLA DE PRODUCTOS
    // ---------------------------------------------------------------------------
    autoTable(doc, {
      startY: clienteY + 12,
      head: [['Código', 'Producto', 'Cantidad', 'Precio Unit.', 'Total']],
      body: items.map((p) => [
        p.codigo,
        p.nombre,
        p.cantidad.toString(),
        `$${p.precio.toFixed(2)}`,
        `$${(p.precio * p.cantidad).toFixed(2)}`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: azul,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });
  
    let finalY = (doc as any).lastAutoTable.finalY;
  
    // ---------------------------------------------------------------------------
    // OBSERVACIONES
    // ---------------------------------------------------------------------------
    const obsText = observaciones || '• Se acepta pago con terminal bancaria.\n• Precios sujetos a disponibilidad.\n• Tiempo de entrega estimado: 24 a 48 hrs.';
    
    let obsY = finalY + 8;
  
    doc.setDrawColor(...azul);
    doc.rect(14, obsY, pageWidth - 28, 28);
  
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Observaciones:', 16, obsY + 6);
  
    doc.setFont('helvetica', 'normal');
    doc.text(obsText, 16, obsY + 12);

    // Ajustamos la posición de los totales para que no se solapen con las observaciones
    let totalsY = obsY + 36;
  
    // ---------------------------------------------------------------------------
    // TOTALES
    // ---------------------------------------------------------------------------
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  
    doc.text(`Subtotal:`, pageWidth - 60, totalsY);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 14, totalsY, { align: 'right' });
  
    totalsY += 6;
    doc.text(`Total descuentos:`, pageWidth - 60, totalsY);
    doc.setTextColor(...rojo);
    doc.text(`-$${totalDescuentos.toFixed(2)}`, pageWidth - 14, totalsY, { align: 'right' });
  
    totalsY += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, pageWidth - 60, totalsY);
    doc.setTextColor(...rojo);
    doc.text(`$${total.toFixed(2)}`, pageWidth - 14, totalsY, { align: 'right' });
  
    // ---------------------------------------------------------------------------
    // GUARDAR
    // ---------------------------------------------------------------------------
    doc.save(`cotizacion-${cliente.nombre.replace(/\s/g, '_')}.pdf`);
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
