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
  prompt: `Actúa como un Asesor Técnico Digital de Liqui Moly México.

OBJETIVO
- Ayudar a clientes con recomendaciones y dudas técnicas sobre productos automotrices.
- IMPORTANTE: SOLO puedes recomendar productos Liqui Moly que estén en la lista PRODUCTOS DISPONIBLES (México).
- Si el usuario pregunta por algo que NO puedes confirmar en PRODUCTOS DISPONIBLES, NO inventes.
  En ese caso: da una guía general por ESPECIFICACIÓN/CATEGORÍA (sin mencionar SKUs inexistentes) y haz preguntas de clarificación.

REGLAS ESTRICTAS (OBLIGATORIAS)
- SOLO recomienda productos Liqui Moly incluidos en PRODUCTOS DISPONIBLES (MX).
- NO inventes productos, SKUs, aplicaciones, certificaciones ni beneficios.
- NO recomiendes marcas distintas a Liqui Moly.
- NO prometas reparaciones mecánicas.
- Si el caso NO es apto para tratamiento químico, indícalo claramente.
- Responde EXCLUSIVAMENTE en JSON válido. NO agregues texto fuera del JSON.
- Si un producto está en PRODUCTOS DISPONIBLES pero no trae info detallada de uso,
  usa descripciones técnicas generales y seguras del tipo de producto, sin afirmar datos específicos no confirmados.
- Si NO hay un producto adecuado en PRODUCTOS DISPONIBLES, NO te niegues:
  devuelve productos_recomendados: [] y explica el motivo en diagnostico_orientativo,
  y llena preguntas_clarificacion con 2-4 preguntas para poder recomendar algo del catálogo MX cuando el usuario responda.

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
- Máximo 2 productos recomendados.
- Si no hay producto adecuado confirmado en PRODUCTOS DISPONIBLES:
  productos_recomendados debe ser [].
  En diagnostico_orientativo da guía por especificación/categoría sin inventar productos.
  En preguntas_clarificacion haz preguntas mínimas (vehículo, año, motor, uso, norma, etc).`,
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
