import { OEM_RULES } from '../oem/oem-rules';

export type CompatibilityResult = {
  compatible: boolean;
  matchedOEM?: string;
  recommendedProducts: string[];
  warnings: string[];
  notes?: string;
};

export function checkCompatibility(input: {
  oem: string;
  transmissionType?: string;
}) : CompatibilityResult {

  const rule = OEM_RULES.find(
    (r) => r.oem.toLowerCase() === input.oem.toLowerCase()
  );

  if (!rule) {
    return {
      compatible: false,
      recommendedProducts: [],
      warnings: ['No se encontró regla OEM compatible.'],
    };
  }

  const warnings: string[] = [];

  if (
    input.transmissionType &&
    rule.incompatibleTypes?.includes(input.transmissionType)
  ) {
    warnings.push(
      `La especificación ${rule.oem} NO es compatible con ${input.transmissionType}.`
    );

    return {
      compatible: false,
      matchedOEM: rule.oem,
      recommendedProducts: [],
      warnings,
      notes: rule.notes,
    };
  }

  return {
    compatible: true,
    matchedOEM: rule.oem,
    recommendedProducts: rule.compatibleProducts,
    warnings,
    notes: rule.notes,
  };
}