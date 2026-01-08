
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  calcularFuncionesRequeridas,
  obtenerProductosRecomendados
} from '@/lib/calculadora/reglas';
import { ProductoLiquiMoly } from '@/lib/calculadora/producto';
import { obtenerProductosFirestore } from '@/lib/firebase/productos';
import { adaptarProductoFirestore } from '@/lib/calculadora/adaptadorProductos';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CalculadoraProductos() {
  const [tipoVehiculo, setTipoVehiculo] = useState<'auto' | 'camioneta' | 'moto' | 'camion'>('auto');
  const [motor, setMotor] = useState<'gasolina' | 'diesel' | 'hibrido'>('gasolina');
  const [kilometraje, setKilometraje] = useState<number>(0);
  const [uso, setUso] = useState<'diario' | 'trabajo_pesado' | 'alto_rendimiento'>('diario');
  const [problema, setProblema] = useState<
    'consumo_aceite' | 'ruido' | 'falta_potencia' | 'mantenimiento' | 'limpieza'
  >('mantenimiento');

  const [recomendados, setRecomendados] = useState<ProductoLiquiMoly[]>([]);
  const [productosCalculadora, setProductosCalculadora] = useState<ProductoLiquiMoly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarProductos() {
      const productosFirestore = await obtenerProductosFirestore();
  
      const adaptados = productosFirestore
        .map(p => adaptarProductoFirestore(p as any))
        .filter((p): p is ProductoLiquiMoly => p !== null);
  
      setProductosCalculadora(adaptados);
      setLoading(false);
    }
  
    cargarProductos();
  }, []);

  const calcular = () => {
    const funciones = calcularFuncionesRequeridas({
      tipoVehiculo,
      motor,
      kilometraje,
      uso,
      problema
    });

    const productosRecomendados = obtenerProductosRecomendados(
      productosCalculadora,
      funciones
    );

    setRecomendados(productosRecomendados);
  };

  const calculatorImage = PlaceHolderImages.find(img => img.id === 'calculator-hero');

  if (loading) {
    return <p className="p-6">Cargando productos...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {calculatorImage && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
          <Image
            src={calculatorImage.imageUrl}
            alt={calculatorImage.description}
            data-ai-hint={calculatorImage.imageHint}
            fill
            className="object-cover"
          />
        </div>
      )}

      <h1 className="text-2xl font-bold">Calculadora de Productos</h1>

      {/* FORMULARIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={tipoVehiculo} onChange={e => setTipoVehiculo(e.target.value as any)}>
          <option value="auto">Auto</option>
          <option value="camioneta">Camioneta</option>
          <option value="moto">Moto</option>
          <option value="camion">Camión</option>
        </select>

        <select value={motor} onChange={e => setMotor(e.target.value as any)}>
          <option value="gasolina">Gasolina</option>
          <option value="diesel">Diésel</option>
          <option value="hibrido">Híbrido</option>
        </select>

        <input
          type="number"
          placeholder="Kilometraje"
          value={kilometraje}
          onChange={e => setKilometraje(Number(e.target.value))}
        />

        <select value={uso} onChange={e => setUso(e.target.value as any)}>
          <option value="diario">Uso diario</option>
          <option value="trabajo_pesado">Trabajo pesado</option>
          <option value="alto_rendimiento">Alto rendimiento</option>
        </select>

        <select value={problema} onChange={e => setProblema(e.target.value as any)}>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="consumo_aceite">Consumo de aceite</option>
          <option value="ruido">Ruido</option>
          <option value="falta_potencia">Falta de potencia</option>
          <option value="limpieza">Limpieza</option>
        </select>
      </div>

      <button
        onClick={calcular}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Calcular recomendación
      </button>

      {/* RESULTADOS */}
      {recomendados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Productos recomendados</h2>

          {recomendados.map(producto => (
            <div
              key={producto.id}
              className="border rounded p-4 flex flex-col gap-2"
            >
              <strong>{producto.nombre}</strong>
              <span className="text-sm text-gray-600">
                {producto.descripcionCorta}
              </span>

              <div className="flex gap-2 mt-2">
                <button className="border px-3 py-1 rounded">
                  Ver ficha
                </button>
                <button className="bg-green-600 text-white px-3 py-1 rounded">
                  Agregar a cotización
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recomendados.length === 0 && (
        <p className="text-gray-500">
          Aún no hay recomendaciones. Completa los datos y calcula.
        </p>
      )}
    </div>
  );
}
