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
    const factor = IMPERIAL_TO_ML[unit];
    return {
      ...quantity,
      amount: quantity.amount * factor,
      maximum: quantity.maximum == null ? undefined : quantity.maximum * factor,
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
      ...quantity,
      amount: quantity.amount * ML_TO_OZ,
      maximum: quantity.maximum == null ? undefined : quantity.maximum * ML_TO_OZ,
      unit: 'oz',
    };
  }

  return quantity;
}
