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
  maxProducts: z.number().optional().default(4),
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

function buildPrompt(params: {
  customerNeeds: string;
  historyText: string;
  maxProducts: number;
  includeComplementaryProducts: boolean;
  responseStyle: 'professional' | 'simple';
  productList: string;
}) {
  const {
    customerNeeds,
    historyText,
    maxProducts,
    includeComplementaryProducts,
    responseStyle,
    productList,
  } = params;

  return `
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
5. explicar claramente por qué convienen,
6. ayudar a que el cliente CONFÍE en la solución,
7. impulsar la decisión de compra de forma natural.

ENFOQUE COMERCIAL
- Debes explicar por qué el producto principal es la mejor opción para el caso.
- Usa lenguaje que genere confianza técnica.
- Siempre que sea útil, sugiere combinación de productos.
- Explica el beneficio real: qué problema resuelve, qué protege o qué mejora.
- Evita respuestas frías, repetitivas o demasiado largas.
- No vendas agresivamente, pero sí guía la decisión.
- Cierra el diagnóstico con una recomendación concreta.
- Debe sonar como un asesor experto que resuelve y orienta la compra.

REGLAS CRÍTICAS
- SOLO puedes recomendar productos que existan en PRODUCTOS DISPONIBLES.
- NO inventes productos.
- NO menciones otras marcas.
- Responde SIEMPRE en español.
- La respuesta final debe cumplir EXACTAMENTE el schema de salida.
- Si el caso es ambiguo, debes dar una recomendación provisional razonable.
- Si falta información importante, puedes agregar preguntas_clarificacion, pero NO debes frenar la recomendación.
- Debes priorizar resolución del problema, seguridad y compatibilidad probable.
- Si el usuario menciona marca/modelo/año/motor, usa tu conocimiento automotriz para inferir viscosidad, categoría o tipo de producto más probable.
- Si no hay coincidencia exacta, recomienda la opción Liqui Moly más cercana y explícalo.
- Siempre que la recomendación dependa de especificaciones del vehículo, agrega en advertencia una nota para revisar el manual del fabricante.
- No prometas resultados milagro.
- Si el caso implica riesgo mecánico, dilo con claridad.

ESTILO DE RESPUESTA
- responseStyle actual: "${responseStyle}"

Si responseStyle = "professional":
- tono técnico, claro, seguro y convincente
- explicación completa pero compacta
- diagnóstico útil para vendedor o cliente final
- lenguaje consultivo-comercial

Si responseStyle = "simple":
- explicación más breve y directa
- clara, concreta y fácil de entender

HISTORIAL DE CONVERSACIÓN:
${historyText}

CASO ACTUAL DEL USUARIO:
"${customerNeeds}"

PRODUCTOS DISPONIBLES (México - única fuente de verdad para nombres/SKUs):
${productList}

INSTRUCCIONES PARA PRODUCTOS
- Debes recomendar entre 1 y ${maxProducts} productos.
- Debe haber EXACTAMENTE 1 producto con prioridad "principal".
- includeComplementaryProducts = ${includeComplementaryProducts ? 'true' : 'false'}
- Si includeComplementaryProducts = true, puedes agregar complementarios si ayudan realmente.
- Si includeComplementaryProducts = false, devuelve solo el producto principal.
- No agregues complementarios de relleno.
- Ordena los productos por utilidad real: primero el principal, luego complementarios.
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

REGLA DE COMBO
- Siempre que tenga sentido técnico y includeComplementaryProducts = true, incluye al menos 1 producto complementario.
- El producto principal debe atacar el problema central.
- El complementario debe mejorar resultados, proteger, limpiar o prevenir recurrencia.
- NO agregues productos sin sentido solo para llenar espacio.
- Si no existe un complementario realmente útil, puedes dejar solo el principal.

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
El texto debe ser profesional, útil, confiable y compacto.

Debe incluir en este orden:
1. Qué parece estar pasando
2. Posible causa o contexto
3. Riesgo si no se atiende
4. Por qué ayuda el producto principal
5. Qué aporta el complementario, si existe
6. Recomendación final clara de qué usar primero

REGLAS DE REDACCIÓN DEL DIAGNÓSTICO
- Máximo 2 párrafos.
- Máximo 900 caracteres.
- No repitas ideas.
- No conviertas el diagnóstico en lista.
- Debe cerrar con una frase tipo:
  - "Para este caso, lo más recomendable es comenzar con..."
  - "La mejor opción inicial para este problema es..."
  - "Si buscas atender la causa y proteger el motor, conviene usar..."

PREGUNTAS DE ACLARACIÓN
- Úsalas solo cuando aporten valor real.
- Máximo 2 preguntas.
- Deben servir para afinar futuras recomendaciones.
- No repitas lo ya explicado.
- Si la recomendación ya es suficientemente clara, devuelve [].

REGLAS DE DESCRIPCIÓN DE PRODUCTOS
- La descripcion de cada producto debe ser breve y persuasiva.
- Máximo 280 caracteres por descripcion.
- como_usar debe ser claro y práctico.
- objetivo debe explicar en una sola frase qué gana el cliente con ese producto.
- Evita repetir lo mismo en todos los productos.

ADVERTENCIA
- Debe ser breve, útil y responsable.
- Máximo 240 caracteres.
- Si el caso requiere revisión mecánica, dilo claramente.
- Si depende de especificaciones del vehículo, indica revisar el manual del fabricante.

COMPORTAMIENTO REALISTA
- No prometas resultados milagro.
- Si hay riesgo mecánico, menciónalo claramente.
- Si algo requiere revisión, dilo sin miedo.
- Genera confianza, no exageración.

CONDICIONES FINALES
- La respuesta debe ser útil para resolver el caso del usuario.
- Máximo ${maxProducts} productos.
- Debe haber exactamente 1 producto principal.
- Si recomiendas aceite o producto dependiente de especificación técnica, advierte revisar manual del vehículo.
- No agregues texto fuera de la salida estructurada.
- El contenido debe ayudar tanto a orientar técnicamente como a facilitar la venta de una solución adecuada.
`;
}

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
            .map(
              (msg) =>
                `${msg.role === 'user' ? 'Usuario' : 'Asesor'}: ${msg.content}`
            )
            .join('\n')
        : 'Sin historial previo.';

    const prompt = buildPrompt({
      customerNeeds: input.customerNeeds,
      historyText,
      maxProducts: input.maxProducts ?? 4,
      includeComplementaryProducts:
        input.includeComplementaryProducts ?? true,
      responseStyle: input.responseStyle ?? 'professional',
      productList,
    });

    const response = await ai.generate({
      prompt,
      output: {
        schema: ProductRecommendationOutputSchema,
      },
    });

    const output = response.output;

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
      preguntas_clarificacion: Array.isArray(output?.preguntas_clarificacion)
        ? output.preguntas_clarificacion
        : [],
      advertencia:
        output?.advertencia ??
        'Verifica la compatibilidad exacta con el manual del vehículo antes de aplicar el producto.',
    };
  }
);