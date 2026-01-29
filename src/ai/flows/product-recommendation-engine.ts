'use server';

/**
 * @fileOverview AI-powered product recommendation engine for Liqui Moly products.
 *
 * - recommendProducts - A function that takes customer needs as input and returns a list of recommended Liqui Moly products.
 * - ProductRecommendationInput - The input type for the recommendProducts function.
 * - ProductRecommendationOutput - The return type for the recommendProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { obtenerProductosFirestore } from '@/lib/firebase/productos';

// Schema for the input of the product recommendation flow.
const ProductRecommendationInputSchema = z.object({
  customerNeeds: z
    .string()
    .describe(
      'A description of the customer needs, including vehicle type, usage conditions, and desired product benefits.'
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
  advertencia: z.string(),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;


const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: z.object({
      customerNeeds: ProductRecommendationInputSchema.shape.customerNeeds,
      productList: z.string().describe("A JSON string of all available products.")
  })},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `Actúa como un Asesor Técnico Digital de Liqui Moly México.

Tu función es recomendar productos Liqui Moly basándote únicamente en síntomas del vehículo.

REGLAS ESTRICTAS (OBLIGATORIAS)
- SOLO recomienda productos Liqui Moly comercializados en México.
- SOLO utiliza la información contenida en los trípticos oficiales proporcionados.
- NO inventes productos, SKUs, aplicaciones ni beneficios.
- NO recomiendes marcas distintas a Liqui Moly.
- NO prometas reparaciones mecánicas.
- Si el caso NO es apto para tratamiento químico, indícalo claramente.
- Responde EXCLUSIVAMENTE en JSON válido.
- NO agregues texto fuera del JSON.

CATEGORÍAS VÁLIDAS: aceites, aditivos, mantenimiento

A partir del siguiente caso descrito por el usuario, analiza la descripción, y luego genera la recomendación en el formato JSON especificado. En el JSON de salida, los campos "categoria" y "sintoma" deben ser tu interpretación del caso del usuario.

CASO DEL USUARIO:
"{{{customerNeeds}}}"

PRODUCTOS DISPONIBLES (utiliza esta lista como fuente de verdad):
{{{productList}}}
`,
});

export const recommendProducts = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    const allProducts = await obtenerProductosFirestore();
    // @ts-ignore
    const activeProducts = allProducts.filter(p => p.activo);
    const productList = JSON.stringify(activeProducts);
    
    const {output} = await prompt({
        ...input,
        productList,
    });
    return output!;
  }
);
