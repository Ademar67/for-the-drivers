import { VEHICLE_RULES } from "./vehicle-rules";

export type DetectedVehicle = {
  brand: string;
  model: string;
  year: number;
};

export function detectVehicle(text: string): DetectedVehicle | null {
  const query = text.toLowerCase();

  const yearMatch = query.match(/\b(19|20)\d{2}\b/);

  if (!yearMatch) {
    return null;
  }

  const year = Number(yearMatch[0]);

  for (const vehicle of VEHICLE_RULES) {
    const modelMatch = query.includes(vehicle.model.toLowerCase());

    const yearMatchRule = year >= vehicle.yearFrom && year <= vehicle.yearTo;

    if (modelMatch && yearMatchRule) {
      return {
        brand: vehicle.brand,
        model: vehicle.model,
        year,
      };
    }
  }

  return null;
}
