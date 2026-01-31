import type { RecipeIngredient } from '../types/Ingredient.ts';

type ScaledQuantity = {
  amount: number;
  unit: RecipeIngredient['quantity']['unit'];
  originalAmount: number;
  originalUnit: RecipeIngredient['quantity']['unit'];
};

// Unit conversion constants for optimization
const IMPERIAL_CONVERSIONS = {
  tsp: { to: 'tbsp' as const, factor: 1 / 3, threshold: 3 },
  tbsp: { to: 'oz' as const, factor: 1 / 2, threshold: 2 },
  oz: { to: 'cup' as const, factor: 1 / 8, threshold: 8 },
};

/**
 * Scales a quantity by the given scale factor
 */
export function scaleQuantity(
  quantity: RecipeIngredient['quantity'],
  scaleFactor: number,
): ScaledQuantity {
  const scaledAmount = quantity.amount * scaleFactor;
  const optimized = getOptimalUnit(scaledAmount, quantity.unit);

  return {
    amount: optimized.amount,
    unit: optimized.unit,
    originalAmount: quantity.amount,
    originalUnit: quantity.unit,
  };
}

/**
 * Converts quantities to the largest reasonable unit
 * For example: 2 tbsp becomes 1 oz, 3 tsp becomes 1 tbsp
 */
export function getOptimalUnit(
  amount: number,
  unit: RecipeIngredient['quantity']['unit'],
): { amount: number; unit: RecipeIngredient['quantity']['unit'] } {
  // Don't optimize very small amounts or non-convertible units
  if (amount < 0.1 || !shouldOptimizeUnit(unit)) {
    return { amount, unit };
  }

  const conversion = IMPERIAL_CONVERSIONS[unit as keyof typeof IMPERIAL_CONVERSIONS];

  if (conversion && amount >= conversion.threshold) {
    const convertedAmount = amount * conversion.factor;
    // Round to reasonable precision
    const roundedAmount = Math.round(convertedAmount * 100) / 100;

    // Recursively check if we can optimize further
    return getOptimalUnit(roundedAmount, conversion.to);
  }

  // Round to reasonable precision for display
  return {
    amount: Math.round(amount * 100) / 100,
    unit,
  };
}

/**
 * Determines if a unit can be optimized to a larger unit
 */
function shouldOptimizeUnit(
  unit: RecipeIngredient['quantity']['unit'],
): unit is keyof typeof IMPERIAL_CONVERSIONS {
  return unit in IMPERIAL_CONVERSIONS;
}

/**
 * Calculates the scale factor from current servings to target servings
 */
export function calculateScaleFactor(
  currentServings: number,
  targetServings: number,
): number {
  if (currentServings <= 0 || targetServings <= 0) {
    return 1;
  }
  return targetServings / currentServings;
}
