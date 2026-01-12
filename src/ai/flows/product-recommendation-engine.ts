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
import { Producto } from '@/lib/firebase-types';

// Schema for the input of the product recommendation flow.
const ProductRecommendationInputSchema = z.object({
  customerNeeds: z
    .string()
    .describe(
      'A description of the customer needs, including vehicle type, usage conditions, and desired product benefits.'
    ),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

const ProductCardSchema = z.object({
    name: z.string().describe("Nombre del producto"),
    sku: z.string().optional().describe("código si lo conoces"),
    why: z.string().optional().describe("por qué aplica al problema"),
    howToUse: z.string().optional().describe("cómo se usa"),
    category: z.enum(["tratamientos", "aceites", "mantenimiento"]).optional(),
    techSheetUrl: z.string().url().optional().describe("url si existe"),
    productUrl: z.string().url().optional().describe("url si existe")
});

// Schema for the output of the product recommendation flow.
const ProductRecommendationOutputSchema = z.object({
  answer: z.string().describe("texto breve y claro en español"),
  products: z.array(ProductCardSchema).describe("Lista de productos recomendados. Si no hay productos, devuelve un array vacío.")
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;


const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: z.object({
      customerNeeds: ProductRecommendationInputSchema.shape.customerNeeds,
      productList: z.string().describe("A JSON string of all available products.")
  })},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `INSTRUCCIONES
Responde SIEMPRE en JSON válido, sin texto adicional, sin markdown.
Debes devolver un objeto con esta forma:

{
  "answer": "texto breve y claro en español",
  "products": [
    {
      "name": "Nombre del producto",
      "sku": "código si lo conoces",
      "why": "por qué aplica al problema",
      "howToUse": "cómo se usa",
      "category": "tratamientos|aceites|mantenimiento",
      "techSheetUrl": "url si existe",
      "productUrl": "url si existe"
    }
  ]
}

Si no hay productos, devuelve "products": [].
Nunca inventes fichas técnicas. Si no sabes la URL, omite techSheetUrl.

A customer has the following needs: {{{customerNeeds}}}.
  
Based on these needs, recommend a list of suitable Liqui Moly products from the following list:
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
