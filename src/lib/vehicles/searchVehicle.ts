import vehicles from "@/data/vehicles.json";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/\s+/g, "")
    .replace(/[()]/g, "");
}

export function searchVehicle(query: string) {
  const q = normalize(query);

  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;

  const matches = vehicles.filter((vehicle: any) => {
    const marca = normalize(vehicle.marca || "");
    const modelo = normalize(vehicle.modelo || "");

    const marcaMatch = q.includes(marca);
    const modeloMatch = q.includes(modelo) || modelo.includes(q);

    let yearMatchVehicle = true;

    if (year) {
      yearMatchVehicle = year >= vehicle.año_inicio && year <= vehicle.año_fin;
    }

    return (marcaMatch || modeloMatch) && yearMatchVehicle;
  });

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a: any, b: any) => {
    const aModelo = normalize(a.modelo);
    const bModelo = normalize(b.modelo);

    const aScore = q.includes(aModelo) ? 2 : 1;
    const bScore = q.includes(bModelo) ? 2 : 1;

    return bScore - aScore;
  });

  return matches[0];
}
