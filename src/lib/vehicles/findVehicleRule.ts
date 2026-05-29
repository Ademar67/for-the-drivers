import { VEHICLE_RULES } from './vehicle-rules';

export function findVehicleRule(input: { brand: string; model: string; year: number; }) {
  // 1. Validación de seguridad: Si no hay input o faltan datos, retornamos undefined
  if (!input || !input.brand || !input.model) {
    return undefined;
  }

  // 2. Buscamos la regla que coincida con los criterios
  return VEHICLE_RULES.find((vehicle) => {
    // Normalizamos a minúsculas para que la comparación sea exacta sin importar las mayúsculas
    const brandMatch = vehicle.brand.toLowerCase() === input.brand.toLowerCase();
    const modelMatch = vehicle.model.toLowerCase() === input.model.toLowerCase();
    
    // Verificamos si el año del vehículo está dentro del rango (mínimo y máximo)
    const yearInRange = input.year >= vehicle.yearFrom && input.year <= vehicle.yearTo;

    return brandMatch && modelMatch && yearInRange;
  });
}