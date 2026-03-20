'use server';

/**
 * @fileOverview AI-powered product recommendation engine for Liqui Moly México.
 *
 * - recommendProducts - Recibe el caso del cliente y devuelve diagnóstico orientativo
 *   con productos recomendados de Liqui Moly México.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { obtenerProductosFirestore } from '@/lib/firebase/productos';

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ProductRecommendationInputSchema = z.object({
  customerNeeds: z
    .string()
    .describe(
      'Descripción del caso o pregunta del cliente. Puede incluir vehículo, año, motor, síntoma, uso, producto buscado, etc.'
    ),
  history: z.array(HistoryMessageSchema).optional().default([]),
  maxProducts: z.number().optional().default(5),
  includeComplementaryProducts: z.boolean().optional().default(true),
  responseStyle: z
    .enum(['professional', 'simple'])
    .optional()
    .default('professional'),
});

export type ProductRecommendationInput = z.infer<
  typeof ProductRecommendationInputSchema
>;

const ProductoRecomendadoSchema = z.object({
  nombre: z.string(),
  tipo: z.string(),
  descripcion: z.string(),
  como_usar: z.string(),
  cuando_usar: z.array(z.string()),
  cuando_no_usar: z.array(z.string()),
  prioridad: z
    .enum(['principal', 'complementario'])
    .optional()
    .default('complementario'),
  objetivo: z.string().optional().default(''),
  compatibilidad: z.string().optional().default(''),
});

const ProductRecommendationOutputSchema = z.object({
  categoria: z.string(),
  sintoma: z.string(),
  diagnostico_orientativo: z.string(),
  severidad: z.enum(['baja', 'media', 'alta']).optional().default('media'),
  productos_recomendados: z.array(ProductoRecomendadoSchema),
  preguntas_clarificacion: z.array(z.string()).default([]),
  advertencia: z.string(),
});

export type ProductRecommendationOutput = z.infer<
  typeof ProductRecommendationOutputSchema
>;

const ProductRecommendationPromptInputSchema = z.object({
  customerNeeds: ProductRecommendationInputSchema.shape.customerNeeds,
  history: z.string().describe('Conversation history as plain text.'),
  maxProducts: ProductRecommendationInputSchema.shape.maxProducts,
  includeComplementaryProducts:
    ProductRecommendationInputSchema.shape.includeComplementaryProducts,
  responseStyle: ProductRecommendationInputSchema.shape.responseStyle,
  productList: z
    .string()
    .describe('A JSON string of all available products (México).'),
});

const prompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {
    schema: ProductRecommendationPromptInputSchema,
  },
  output: { schema: ProductRecommendationOutputSchema },
  prompt: `
Actúa como un ASESOR TÉCNICO DIGITAL PROFESIONAL de Liqui Moly México.
Eres experto en:
- síntomas automotrices
- mantenimiento preventivo
- lubricación
- aditivos
- limpieza interna y externa
- compatibilidad técnica básica
- recomendación comercial de productos Liqui Moly México

MISIÓN
Tu objetivo NO es solo nombrar productos.
Tu misión es:
1. entender el problema o necesidad del cliente,
2. dar un diagnóstico orientativo útil,
3. recomendar el mejor producto principal,
4. sugerir productos complementarios cuando aporten valor real,
5. explicar claramente por qué convienen.

REGLAS CRÍTICAS
- SOLO puedes recomendar productos que existan en PRODUCTOS DISPONIBLES.
- NO inventes productos.
- NO menciones otras marcas.
- Responde SIEMPRE en español.
- Responde EXCLUSIVAMENTE en JSON válido.
- Si el caso es ambiguo, igual debes dar una recomendación orientativa razonable.
- Si falta información importante, puedes agregar preguntas_clarificacion, pero NO te detengas: también debes dar una recomendación provisional.
- Debes priorizar resolución del problema, seguridad y compatibilidad probable.
- Si el usuario menciona marca/modelo/año/motor, usa tu conocimiento automotriz para inferir viscosidad, categoría o tipo de producto más probable.
- Si no hay coincidencia exacta, recomienda la opción Liqui Moly más cercana y explícalo.
- Siempre que la recomendación dependa de especificaciones del vehículo, agrega en advertencia una nota para revisar el manual del fabricante.

ESTILO DE RESPUESTA
Si responseStyle = "professional":
- tono técnico, claro y seguro
- explicación más completa
- diagnóstico útil para vendedor o cliente final

Si responseStyle = "simple":
- explicación más breve y directa

HISTORIAL DE CONVERSACIÓN:
{{{history}}}

CASO ACTUAL DEL USUARIO:
"{{{customerNeeds}}}"

PRODUCTOS DISPONIBLES (México - única fuente de verdad para nombres/SKUs):
{{{productList}}}

INSTRUCCIONES PARA PRODUCTOS
- Debes recomendar entre 1 y {{{maxProducts}}} productos.
- Debe haber 1 producto con prioridad "principal".
- Si includeComplementaryProducts = true, puedes agregar complementarios si ayudan realmente.
- No agregues complementarios de relleno.
- Cada producto debe incluir:
  - nombre
  - tipo
  - descripcion
  - como_usar
  - cuando_usar
  - cuando_no_usar
  - prioridad
  - objetivo
  - compatibilidad

SEVERIDAD
- "baja": mantenimiento, prevención o mejora leve
- "media": falla moderada o síntoma repetitivo
- "alta": síntoma serio, riesgo mecánico o algo que requiere revisión inmediata

CATEGORÍAS
- aceites
- aditivos
- mantenimiento
- refrigerante
- grasas
- transmision
- limpieza
- frenos
- combustible
- cuidado
- general

ESTRUCTURA DEL DIAGNÓSTICO ORIENTATIVO
Debe verse profesional y útil:
- qué parece estar pasando
- posible causa o contexto
- por qué el/los productos ayudan
- siguiente acción recomendada

FORMATO OBLIGATORIO:
{
  "categoria": "",
  "sintoma": "",
  "diagnostico_orientativo": "",
  "severidad": "baja | media | alta",
  "productos_recomendados": [
    {
      "nombre": "",
      "tipo": "",
      "descripcion": "",
      "como_usar": "",
      "cuando_usar": [],
      "cuando_no_usar": [],
      "prioridad": "principal | complementario",
      "objetivo": "",
      "compatibilidad": ""
    }
  ],
  "preguntas_clarificacion": [],
  "advertencia": ""
}

CONDICIONES FINALES
- La respuesta debe ser útil para resolver el caso del usuario.
- Máximo {{{maxProducts}}} productos.
- Debe haber al menos 1 producto principal.
- Si recomiendas aceite o producto dependiente de especificación técnica, advierte revisar manual del vehículo.
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
    const productList = JSON.stringify(allProducts);

    const historyText =
      input.history && input.history.length > 0
        ? input.history
            .map((msg) => `${
              msg.role === 'user' ? 'Usuario' : 'Asesor'
            }: ${msg.content}`)
            .join('\n')
        : 'Sin historial previo.';

    const { output } = await prompt({
      customerNeeds: input.customerNeeds,
      history: historyText,
      maxProducts: input.maxProducts,
      includeComplementaryProducts: input.includeComplementaryProducts,
      responseStyle: input.responseStyle,
      productList,
    });

    return {
      categoria: output?.categoria ?? 'general',
      sintoma: output?.sintoma ?? input.customerNeeds,
      diagnostico_orientativo:
        output?.diagnostico_orientativo ??
        'No se pudo generar un diagnóstico orientativo claro.',
      severidad: output?.severidad ?? 'media',
      productos_recomendados: Array.isArray(output?.productos_recomendados)
        ? output.productos_recomendados
        : [],
      preguntas_clarificacion: output?.preguntas_clarificacion ?? [],
      advertencia:
        output?.advertencia ??
        'Verifica siempre la compatibilidad exacta con el manual del vehículo antes de aplicar el producto.',
    };
  }
);