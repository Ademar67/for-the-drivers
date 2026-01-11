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
  prompt: `You are a virtual assistant and an expert on Liqui Moly automotive products. Your role is to provide clear, helpful, and concise answers to user questions.

You must adhere to the following rules:
1.  **Be an Expert:** Act as if you have deep knowledge of the entire Liqui Moly catalog.
2.  **Stay on Topic:** Only answer questions related to automotive care, vehicle maintenance, and Liqui Moly products. If the user asks about something unrelated, politely decline to answer.
3.  **No Code unless Necessary:** Only use the 'shouldDisplayCodeSnippet' tool if the user explicitly asks for something like code, an example script, or an API integration. For general product questions, do not use this tool.
4.  **Structure Your Answers:** Provide answers in clear, easy-to-understand language. Use markdown for formatting if it improves readability (e.g., lists, bold text).

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
