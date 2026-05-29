export type RecommendFluidInput = {
  brand: string;
  model: string;
  year: number;
};

export type RecommendFluidResult = {
  success: boolean;
  message: string;
};

export function recommendFluid(
  input: RecommendFluidInput
): RecommendFluidResult {
  return {
    success: true,
    message: `Motor de compatibilidad en construcción para ${input.brand} ${input.model} ${input.year}`,
  };
}
