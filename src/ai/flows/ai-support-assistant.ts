'use server';

/**
 * @fileOverview This file defines the AI support assistant flow for answering user questions about Liqui Moly products.
 *
 * It includes:
 * - `askSupportAssistant` -  A function that takes a user query and returns an answer, potentially including code snippets.
 * - `AiSupportAssistantInput` - The input type for the `askSupportAssistant` function.
 * - `AiSupportAssistantOutput` - The output type for the `askSupportAssistant` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSupportAssistantInputSchema = z.object({
  query: z.string().describe('The user query about Liqui Moly products.'),
});
export type AiSupportAssistantInput = z.infer<typeof AiSupportAssistantInputSchema>;

const AiSupportAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query, potentially including code snippets.'),
});
export type AiSupportAssistantOutput = z.infer<typeof AiSupportAssistantOutputSchema>;

export async function askSupportAssistant(input: AiSupportAssistantInput): Promise<AiSupportAssistantOutput> {
  return aiSupportAssistantFlow(input);
}

const shouldDisplayCodeSnippet = ai.defineTool({
  name: 'shouldDisplayCodeSnippet',
  description: 'Determines if a code snippet is relevant to the user query. Use this tool if code is needed.',
  inputSchema: z.object({
    query: z.string().describe('The user query.'),
  }),
  outputSchema: z.boolean().describe('True if a code snippet is relevant, false otherwise.'),
}, async (input) => {
  // Implement logic here to determine if a code snippet is relevant.
  // For now, let's just return true if the query contains the word "code".
  return input.query.toLowerCase().includes('code');
});

const aiSupportAssistantPrompt = ai.definePrompt({
  name: 'aiSupportAssistantPrompt',
  input: {schema: AiSupportAssistantInputSchema},
  output: {schema: AiSupportAssistantOutputSchema},
  tools: [shouldDisplayCodeSnippet],
  prompt: `You are a virtual assistant for Liqui Moly products. Answer the user query based on your knowledge of the products.

  If the user asks for code, first use the 'shouldDisplayCodeSnippet' to determine if code should be displayed.

  If the tool says code should be displayed, then include a relevant code snippet in your answer.

  User Query: {{{query}}}
  `,
});

const aiSupportAssistantFlow = ai.defineFlow(
  {
    name: 'aiSupportAssistantFlow',
    inputSchema: AiSupportAssistantInputSchema,
    outputSchema: AiSupportAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiSupportAssistantPrompt(input);
    return output!;
  }
);
