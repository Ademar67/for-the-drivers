import { NextResponse } from "next/server";
import { iaTecnicaFlow } from "@/ai/flows/ia-tecnica";
import { searchVehicle } from "@/lib/vehicles/searchVehicle";

export async function POST(req: Request) {
  try {
    const { consulta } = await req.json();

    const vehicle = searchVehicle(consulta);

    if (vehicle) {
      return NextResponse.json({
        respuesta: `
ACEITE MOTOR
${vehicle.aceite_motor_recomendado}

VISCOSIDAD
${vehicle.viscosidad}

CAPACIDAD
${vehicle.capacidad_aceite_litros} L

NORMA OEM
${vehicle.norma_oem}

TRANSMISIÓN
${vehicle.transmision}

FLUIDO TRANSMISIÓN
${vehicle.fluido_transmision_recomendado}

REFRIGERANTE
${vehicle.refrigerante_recomendado}

OBSERVACIONES
${vehicle.observaciones}
        `,
      });
    }

    const respuesta = await iaTecnicaFlow({
      consulta,
    });

    return NextResponse.json({
      respuesta,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        respuesta: "Error al consultar IA Técnica",
      },
      { status: 500 }
    );
  }
}
