import { Ingredient, IngredientType } from '@/types/Ingredient';

const INGREDIENT_PRIORITIES: Record<IngredientType, number> = {
  juice: 0,
  syrup: 0,
  liqueur: 2,
  spirit: 2,
};

/**
 * Sorts the ingredients true to the Death & Co's method.
 */
export default function sortIngredients(ingredients: Ingredient[]) {
  // TODO: should convert units in case they're misaligned.

  return ingredients.sort((a, b) => {
    // Sort any dashes first
    if (a.quantity.unit === 'dash' && b.quantity.unit !== 'dash') {
      return -1;
    }

    // Same value ingredients, sort by quantity
    if (INGREDIENT_PRIORITIES[a.type] === INGREDIENT_PRIORITIES[b.type]) {
      return a.quantity.amount < b.quantity.amount ? -1 : 1;
    }
    // Otherwise lowest value first; ex: juices & syrup first.
    else {
      return INGREDIENT_PRIORITIES[a.type] < INGREDIENT_PRIORITIES[b.type] ? -1 : 1;
    }
  });
}
