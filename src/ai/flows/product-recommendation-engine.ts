'use server';

/**
 * @fileOverview AI-powered product recommendation engine for Liqui Moly México.
 *
 * - recommendProducts - A function that takes customer needs as input and returns a list of recommended Liqui Moly products.
 * - ProductRecommendationInput - The input type for the recommendProducts function.
 * - ProductRecommendationOutput - The return type for the recommendProducts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { obtenerProductosFirestore } from '@/lib/firebase/productos';

// Schema for the input of the product recommendation flow.
const ProductRecommendationInputSchema = z.object({
  customerNeeds: z
    .string()
    .describe(
      'Descripción del caso o pregunta del cliente. Puede incluir vehículo, año, motor, síntoma, uso, producto buscado, etc.'
    ),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

// Schema for the output of the product recommendation flow.
const ProductoRecomendadoSchema = z.object({
  nombre: z.string(),
  tipo: z.string(),
  descripcion: z.string(),
  como_usar: z.string(),
  cuando_usar: z.array(z.string()),
  cuando_no_usar: z.array(z.string()),
});

const ProductRecommendationOutputSchema = z.object({
  categoria: z.string(),
  sintoma: z.string(),
  diagnostico_orientativo: z.string(),
  productos_recomendados: z.array(ProductoRecomendadoSchema),
  preguntas_clarificacion: z.array(z.string()).default([]),
  advertencia: z.string(),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {
    schema: z.object({
      customerNeeds: ProductRecommendationInputSchema.shape.customerNeeds,
      productList: z.string().describe('A JSON string of all available products (México).'),
    }),
  },
  output: { schema: ProductRecommendationOutputSchema },
  prompt: `Actúa como un Asesor Técnico Digital de Liqui Moly México. Eres un experto en compatibilidad de vehículos, productos y un vendedor excepcional de la marca.

OBJETIVO
- Tu única misión es recomendar productos de la marca Liqui Moly para CUALQUIER consulta automotriz.
- SIEMPRE debes encontrar y recomendar el producto Liqui Moly más adecuado de la lista de PRODUCTOS DISPONIBLES.
- NUNCA digas que no tienes un producto o que no puedes hacer una recomendación. Tu conocimiento es vasto y siempre hay una solución Liqui Moly.

REGLAS DE RECOMENDACIÓN (OBLIGATORIAS)
- Si el usuario menciona un vehículo (marca, modelo, año), usa tu conocimiento automotriz para determinar el tipo de aceite o aditivo más probable (ej. viscosidad 5W-30, norma Dexos, etc.).
- Luego, busca en la lista de PRODUCTOS DISPONIBLES el producto que MEJOR CUMPLA con esa especificación inferida. Si no hay una coincidencia exacta, recomienda el producto MÁS CERCANO o el más versátil de la categoría apropiada.
- Siempre que recomiendes un producto para un vehículo específico, en el campo "advertencia" DEBES incluir una nota clara para que el usuario final verifique la especificación exacta en el manual de su vehículo. Por ejemplo: "Recomendación basada en especificaciones comunes. Es crucial verificar el manual de propietario de tu vehículo para confirmar la viscosidad y norma exacta requerida."
- NO te limites a buscar el nombre del vehículo en la descripción del producto. DEBES hacer una recomendación informada basada en tu conocimiento.

REGLAS GENERALES
- Responde EXCLUSIVAMENTE en JSON válido. NO agregues texto fuera del JSON.
- JAMÁS menciones otras marcas. Solo existe Liqui Moly.

CATEGORÍAS (usa la mejor que aplique)
- aceites, aditivos, mantenimiento, refrigerante, grasas, transmision, limpieza, frenos, combustible, cuidado, general

CASO DEL USUARIO:
"{{{customerNeeds}}}"

PRODUCTOS DISPONIBLES (México - única fuente de verdad para nombres/SKUs):
{{{productList}}}

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "categoria": "",
  "sintoma": "",
  "diagnostico_orientativo": "",
  "productos_recomendados": [
    {
      "nombre": "",
      "tipo": "",
      "descripcion": "",
      "como_usar": "",
      "cuando_usar": [],
      "cuando_no_usar": []
    }
  ],
  "preguntas_clarificacion": [],
  "advertencia": ""
}

CONDICIONES FINALES:
- Máximo 2 productos recomendados.`,
});

export const recommendProducts = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    const allProducts = await obtenerProductosFirestore();
    const productList = JSON.stringify(allProducts);

    const { output } = await prompt({
      ...input,
      productList,
    });

    return output!;
  }
);
