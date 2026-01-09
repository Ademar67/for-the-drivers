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
const ProductRecommendationOutputSchema = z.object({
  recommendedProducts: z
    .array(z.object({
      id: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      justificacion: z.string()
    }))
    .describe('A list of recommended Liqui Moly products based on the customer needs.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;


const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: z.object({
      customerNeeds: ProductRecommendationInputSchema.shape.customerNeeds,
      productList: z.string().describe("A JSON string of all available products.")
  })},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `You are an expert in Liqui Moly products. A customer has the following needs: {{{customerNeeds}}}.
  
  Based on these needs, recommend a list of suitable Liqui Moly products from the following list:
  {{{productList}}}
  
  For each recommended product, provide its id, name, a brief description, and a justification for why it's recommended.
  Return the response as a structured JSON object.`,
});

export const recommendProducts = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    const products = await obtenerProductosFirestore();
    const productList = JSON.stringify(products);
    
    const {output} = await prompt({
        ...input,
        productList,
    });
    return output!;
  }
);
