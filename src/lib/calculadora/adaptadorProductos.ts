import { ProductoLiquiMoly, FuncionProducto } from './producto';

interface ProductoFirestore {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  capacidad: string;
  precio: number;
}

/**
 * Convierte un producto de Firestore al formato
 * que entiende la calculadora
 */
export function adaptarProductoFirestore(
  producto: ProductoFirestore
): ProductoLiquiMoly | null {
  // Solo categorías que queremos recomendar al cliente
  if (
    producto.categoria !== 'Aceites' &&
    producto.categoria !== 'Tratamientos'
  ) {
    return null;
  }

  return {
    id: producto.id,
    nombre: producto.nombre,
    linea: producto.categoria === 'Aceites' ? 'Aceites' : 'Aditivos',
    tipoVehiculo: ['auto', 'camioneta'], // default seguro
    motor: ['gasolina', 'diesel'], // default seguro
    funciones: inferirFunciones(producto), // 👈 AQUÍ SE USA
    disponibleMX: true,
    descripcionCorta: generarDescripcion(producto)
  };
}

/**
 * PASO 2 — INFERIR FUNCIONES (SIN IA)
 * Traduce el nombre del producto a "funciones comerciales"
 */
function inferirFunciones(producto: { nombre: string }): FuncionProducto[] {
  const nombre = producto.nombre.toLowerCase();
  const funciones: FuncionProducto[] = [];

  if (nombre.includes('flush') || nombre.includes('cleaner')) {
    funciones.push('limpieza_motor');
  }

  if (nombre.includes('diesel')) {
    funciones.push('limpieza_inyectores');
  }

  if (nombre.includes('molygen') || nombre.includes('synthoil')) {
    funciones.push('proteccion_motor');
    funciones.push('mantenimiento_preventivo');
  }

  // Fallback seguro
  if (funciones.length === 0) {
    funciones.push('mantenimiento_preventivo');
  }

  return funciones;
}

/**
 * Descripción corta para vista cliente
 */
function generarDescripcion(producto: {
  categoria: string;
  capacidad: string;
}) {
  return `${producto.categoria} Liqui Moly – Presentación ${producto.capacidad}`;
}
