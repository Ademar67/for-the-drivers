import vehicles from "@/data/vehicles.json";

export function searchVehicle(query: string) {
  const q = query.toLowerCase();

  return vehicles.find((vehicle: any) => {
    const marca = vehicle.marca?.toLowerCase() || "";
    const modelo = vehicle.modelo?.toLowerCase() || "";

    return (
      q.includes(marca) ||
      q.includes(modelo) ||
      `${marca} ${modelo}`.includes(q)
    );
  });
}