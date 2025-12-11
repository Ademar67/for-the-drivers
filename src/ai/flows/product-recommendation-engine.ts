'use server';

/**
 * @fileOverview AI-powered product recommendation engine for Liqui Moly products.
 *
 * - recommendProducts - A function that takes customer needs as input and returns a list of recommended Liqui Moly products.
 * - ProductRecommendationInput - The input type for the recommendProducts function.
 * - ProductRecommendationOutput - The return type for the recommendProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationInputSchema = z.object({
  customerNeeds: z
    .string()
    .describe(
      'A description of the customer needs, including vehicle type, usage conditions, and desired product benefits.'
    ),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

const ProductRecommendationOutputSchema = z.object({
  recommendedProducts: z
    .string()
    .describe('A list of recommended Liqui Moly products based on the customer needs.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

export async function recommendProducts(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
  return recommendProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: ProductRecommendationInputSchema},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `You are an expert in Liqui Moly products. A customer has the following needs: {{{customerNeeds}}}. Based on these needs, recommend a list of Liqui Moly products that would be suitable for them. `,
});

const recommendProductsFlow = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
