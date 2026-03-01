import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const isProd = process.env.NODE_ENV === 'production';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',

  // 🔥 Desactiva tracing en producción
  tracing: isProd ? false : true,
});