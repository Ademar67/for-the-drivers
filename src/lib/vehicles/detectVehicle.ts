export type DetectedVehicle = {
  brand: string;
  model: string;
  year: number;
};

export function detectVehicle(text: string): DetectedVehicle | null {
  const query = text.toLowerCase();

  // Toyota RAV4 2015
  if (query.includes("rav4") && query.includes("2015")) {
    return {
      brand: "Toyota",
      model: "RAV4",
      year: 2015,
    };
  }

  // Volkswagen Golf GTI 2018
  if (query.includes("golf gti") && query.includes("2018")) {
    return {
      brand: "Volkswagen",
      model: "Golf GTI",
      year: 2018,
    };
  }

  // Nissan Sentra 2017
  if (query.includes("sentra") && query.includes("2017")) {
    return {
      brand: "Nissan",
      model: "Sentra",
      year: 2017,
    };
  }

  return null;
}
