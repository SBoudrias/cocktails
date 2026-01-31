import type { RecipeIngredient } from '@cocktails/data';

const IMPERIAL_TO_ML = {
  tsp: 5,
  tbsp: 15,
  oz: 30,
  cup: 240,
};

function shouldConvertUnit(unit: string): unit is keyof typeof IMPERIAL_TO_ML {
  return unit in IMPERIAL_TO_ML;
}

export function convertQuantityToMl(
  quantity: RecipeIngredient['quantity'],
): RecipeIngredient['quantity'] {
  const unit: string = quantity.unit;
  if (shouldConvertUnit(unit)) {
    return {
      amount: quantity.amount * IMPERIAL_TO_ML[unit],
      unit: 'ml',
    };
  }

  return quantity;
}

const ML_TO_OZ = 1 / 30;

export function convertQuantityToOz(
  quantity: RecipeIngredient['quantity'],
): RecipeIngredient['quantity'] {
  if (quantity.unit === 'ml') {
    return {
      amount: quantity.amount * ML_TO_OZ,
      unit: 'oz',
    };
  }

  return quantity;
}
