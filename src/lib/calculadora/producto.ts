// src/lib/calculadora/producto.ts

export type FuncionProducto =
  | 'consumo_aceite'
  | 'limpieza_motor'
  | 'proteccion_motor'
  | 'reduccion_friccion'
  | 'reduccion_ruido'
  | 'mejora_potencia'
  | 'mantenimiento_preventivo'
  | 'limpieza_inyectores'
  | 'cuidado_combustible';

export interface ProductoLiquiMoly {
  id: string;
  nombre: string;
  linea: 'Aceites' | 'Aditivos' | 'Cuidado' | 'Servicio';
  tipoVehiculo: Array<'auto' | 'camioneta' | 'moto' | 'camion'>;
  motor: Array<'gasolina' | 'diesel' | 'hibrido'>;
  funciones: FuncionProducto[];
  disponibleMX: boolean;
  descripcionCorta: string;
}
