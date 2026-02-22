
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClienteFS } from '@/lib/firestore/clientes';
import { Cotizacion } from '@/lib/firestore/cotizaciones';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  const [cliente, setCliente] = useState<ClienteFS | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  useEffect(() => {
    async function fetchCliente() {
      const docRef = doc(db, 'clientes', params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCliente({ id: docSnap.id, ...docSnap.data() } as ClienteFS);
      }
    }

    async function fetchCotizaciones() {
      const q = collection(db, 'cotizaciones');
      const querySnapshot = await getDocs(q);
      const cots = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Cotizacion))
        .filter(c => c.clienteId === params.id);
      setCotizaciones(cots);
    }

    fetchCliente();
    fetchCotizaciones();
  }, [params.id]);

  if (!cliente) {
    return <div>Cargando...</div>;
  }

  const handleViewPDF = async (cotizacion: Cotizacion) => {
    const blob = await generarCotizacionPDF(cotizacion);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{cliente.nombre}</h1>
      <p>Email: {cliente.email}</p>
      <p>Teléfono: {cliente.telefono}</p>
      <p>Domicilio: {cliente.domicilio}</p>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Cotizaciones</h2>
        {cotizaciones.length > 0 ? (
          <ul className="space-y-4">
            {cotizaciones.map(cot => (
              <li key={cot.id} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p>Folio: {cot.id}</p>
                    <p>Fecha: {new Date(cot.fecha_creacion.seconds * 1000).toLocaleDateString()}</p>
                    <p>Total: ${cot.total.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleViewPDF(cot)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Ver PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay cotizaciones para este cliente.</p>
        )}
      </div>
    </div>
  );
}
