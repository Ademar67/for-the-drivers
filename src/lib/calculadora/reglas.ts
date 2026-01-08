// src/lib/calculadora/reglas.ts

import { FuncionProducto, ProductoLiquiMoly } from './producto';

export interface CalculadoraInput {
  tipoVehiculo: 'auto' | 'camioneta' | 'moto' | 'camion';
  motor: 'gasolina' | 'diesel' | 'hibrido';
  kilometraje: number;
  uso: 'diario' | 'trabajo_pesado' | 'alto_rendimiento';
  problema:
    | 'consumo_aceite'
    | 'ruido'
    | 'falta_potencia'
    | 'mantenimiento'
    | 'limpieza';
}

export function calcularFuncionesRequeridas(
  input: CalculadoraInput
): FuncionProducto[] {
  const funciones = new Set<FuncionProducto>();
  const { kilometraje, uso, problema } = input;

  switch (problema) {
    case 'consumo_aceite':
      funciones.add('consumo_aceite');
      funciones.add('proteccion_motor');
      break;

    case 'ruido':
      funciones.add('reduccion_ruido');
      funciones.add('reduccion_friccion');
      break;

    case 'falta_potencia':
      funciones.add('mejora_potencia');
      funciones.add('limpieza_motor');
      break;

    case 'mantenimiento':
      funciones.add('mantenimiento_preventivo');
      break;

    case 'limpieza':
      funciones.add('limpieza_motor');
      funciones.add('limpieza_inyectores');
      break;
  }

  if (kilometraje > 80000) {
    funciones.add('proteccion_motor');
  }

  if (kilometraje > 120000) {
    funciones.add('reduccion_friccion');
  }

  if (uso === 'alto_rendimiento') {
    funciones.add('proteccion_motor');
    funciones.add('mejora_potencia');
  }

  if (uso === 'trabajo_pesado') {
    funciones.add('proteccion_motor');
  }

  return Array.from(funciones);
}

export function obtenerProductosRecomendados(
  productos: ProductoLiquiMoly[],
  funciones: FuncionProducto[]
): ProductoLiquiMoly[] {
  return productos.filter(
    p =>
      p.disponibleMX &&
      funciones.some(f => p.funciones.includes(f))
  );
}
