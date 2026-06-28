import vehicles from "@/data/vehicles.json";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD") // Elimina acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_\s()\/]/g, ""); // Elimina espacios, guiones, paréntesis y diagonales
}

export function searchVehicle(query: string) {
  if (!query) return null;

  // Extraer año
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

  // Quitar el año de la consulta
  const textQuery = yearMatch ? query.replace(yearMatch[0], "") : query;

  // Consulta normalizada
  const q = normalize(textQuery);

  // Separar palabras útiles
  const words = (textQuery.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (w) => w.length >= 2
  );

  if (!q && !year) return null;

  const matches = vehicles.filter((vehicle: any) => {
    const marca = normalize(vehicle.marca || "");
    const modelo = normalize(vehicle.modelo || "");

    const marcaMatch =
      words.some((w) => marca.includes(normalize(w))) || q.includes(marca);

    const modeloMatch =
      words.some((w) => modelo.includes(normalize(w))) || q.includes(modelo);

    const yearMatchVehicle =
      !year || (year >= vehicle.año_inicio && year <= vehicle.año_fin);

    return (marcaMatch || modeloMatch) && yearMatchVehicle;
  });

  if (!matches.length) {
    return null;
  }

  // Ordenar por relevancia
  matches.sort((a: any, b: any) => {
    const aMarca = normalize(a.marca || "");
    const bMarca = normalize(b.marca || "");

    const aModelo = normalize(a.modelo || "");
    const bModelo = normalize(b.modelo || "");

    let scoreA = 0;
    let scoreB = 0;

    // Coincidencia exacta del modelo
    if (q === aModelo) scoreA += 100;
    if (q === bModelo) scoreB += 100;

    // Coincidencia exacta de marca
    if (q === aMarca) scoreA += 40;
    if (q === bMarca) scoreB += 40;

    // Marca + modelo completos
    if (q.includes(aMarca) && q.includes(aModelo)) scoreA += 80;
    if (q.includes(bMarca) && q.includes(bModelo)) scoreB += 80;

    // Cada palabra encontrada suma puntos
    words.forEach((w) => {
      const n = normalize(w);

      if (aMarca.includes(n)) scoreA += 10;
      if (aModelo.includes(n)) scoreA += 20;

      if (bMarca.includes(n)) scoreB += 10;
      if (bModelo.includes(n)) scoreB += 20;
    });

    return scoreB - scoreA;
  });

  return matches[0];
}
