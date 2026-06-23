import { ai } from "@/ai/genkit";
import { z } from "zod";

export const iaTecnicaFlow = ai.defineFlow(
  {
    name: "iaTecnicaFlow",
    inputSchema: z.object({
      consulta: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ consulta }) => {
    const prompt = `
Eres un asesor técnico experto de Liqui Moly México.

IMPORTANTE:
- Responde de forma breve y profesional.
- No escribas explicaciones largas.
- No escribas párrafos extensos.
- Si no conoces un dato, escribe "Por confirmar".
- Máximo 12 líneas.

Usa SIEMPRE este formato:

ACEITE MOTOR
...

CAPACIDAD
...

NORMA OEM
...

TRANSMISIÓN
...

TRATAMIENTOS RECOMENDADOS
...

OBSERVACIONES
...

Consulta:

${consulta}
`;

    const response = await ai.generate({
      prompt,
    });

    return response.text;
  }
);