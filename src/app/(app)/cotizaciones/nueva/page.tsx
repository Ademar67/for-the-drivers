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

/* 🔥 FIX TIPOS */
type ProductoConId = Omit<Producto, 'nombre' | 'precio' | 'codigo'> & {
  id: string;
  nombre: string;
  precio: number;
  codigo?: string;
};

interface ItemCotizacion extends ProductoConId {
  cantidad: number;
  descuentos: [
    number | undefined,
    number | undefined,
    number | undefined,
    number | undefined
  ];
}

/* 🔥 NORMALIZADOR (clave para evitar errores) */
function normalizarProducto(id: string, data: Partial<Producto>): ProductoConId {
  return {
    ...data,
    id,
    nombre: data.nombre ?? '',
    precio: typeof data.precio === 'number' ? data.precio : 0,
    codigo: data.codigo ?? '',
  };
}

function calcularTotalesLinea(item: ItemCotizacion) {
  const subtotalLinea = item.precio * item.cantidad;

  const totalLinea = item.descuentos.reduce((acc, d) => {
    if (d === undefined || d <= 0) return acc;
    return acc * (1 - d / 100);
  }, subtotalLinea);

  return {
    subtotalLinea,
    totalLinea,
    descuentoLinea: subtotalLinea - totalLinea,
  };
}

export default function NuevaCotizacionPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [productos, setProductos] = useState<ProductoConId[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');
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
      const snap = await getDocs(collection(db, 'productos'));

      const prods = snap.docs.map((doc) =>
        normalizarProducto(doc.id, doc.data() as Partial<Producto>)
      );

      setProductos(prods);
    }

    fetchProductos();
    return () => unsub();
  }, []);

  const agregarProducto = (producto: ProductoConId) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === producto.id);

      if (existe) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
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

  const handleCantidadChange = (id: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, cantidad: Math.max(0, cantidad || 0) } : i
      )
    );
  };

  const handleDescuentoItemChange = (id: string, index: number, valor: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nuevos = [...item.descuentos] as ItemCotizacion['descuentos'];
        const val = parseFloat(valor);

        nuevos[index] = Number.isNaN(val) ? undefined : val;

        return { ...item, descuentos: nuevos };
      })
    );
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const productosFiltrados = busqueda
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          (p.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase())
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
    const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);

    if (!cliente || items.length === 0) {
      toast({
        title: 'Faltan datos',
        description: 'Selecciona cliente y productos',
        type: 'warning',
      });
      return;
    }

    await crearCotizacion({
      clienteId: cliente.id!,
      clienteNombre: cliente.nombre ?? '',
      items: items.map((i) => {
        const { subtotalLinea, descuentoLinea, totalLinea } =
          calcularTotalesLinea(i);

        return {
          productoId: i.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio,
          codigo: i.codigo ?? '',
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

    router.push('/cotizaciones');
  };

  const buildPDF = (): CotizacionPDFData | null => {
    const cliente = clientes.find((c) => c.id === clienteSeleccionadoId);
    if (!cliente) return null;

    return {
      id: 'NUEVA',
      clienteNombre: cliente.nombre ?? '',
      items: items.map((i) => ({
        codigo: i.codigo ?? '',
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio: i.precio,
      })),
      subtotal,
      total,
      totalDescuentos,
      observaciones,
      vigenciaDias,
    };
  };

  const handlePDF = async () => {
    const data = buildPDF();
    if (!data) return;

    const blob = await generarCotizacionPDF(data);
    window.open(URL.createObjectURL(blob));
  };

  const handleWhats = async () => {
    const data = buildPDF();
    if (!data) return;

    const blob = await generarCotizacionPDF(data);

    await sharePdfViaWhatsapp({
      fileName: `Cotizacion-${data.clienteNombre}.pdf`,
      pdfBlob: blob,
      message: `Cotización para ${data.clienteNombre}`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nueva Cotización</h1>

      <select
        value={clienteSeleccionadoId}
        onChange={(e) => setClienteSeleccionadoId(e.target.value)}
      >
        <option value="">Selecciona cliente</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      <input
        placeholder="Buscar producto"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {productosFiltrados.map((p) => (
        <div key={p.id} onClick={() => agregarProducto(p)}>
          {p.nombre} - ${p.precio}
        </div>
      ))}

      <button onClick={handlePDF}>
        <FileDown /> PDF
      </button>

      <button onClick={handleWhats}>
        <MessageCircle /> WhatsApp
      </button>

      <button onClick={handleGuardarCotizacion}>
        Guardar
      </button>
    </div>
  );
}