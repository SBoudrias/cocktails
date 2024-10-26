import { convertQuantityToMl } from '@/modules/conversion';
import { RecipeIngredient, IngredientType, Unit } from '@/types/Ingredient';

const UNIT_PRIORITIES: Record<Unit, number> = {
  drop: 0,
  dash: 1,
  tsp: 2,
  tbsp: 2,
  oz: 2,
  ml: 2,
};

const INGREDIENT_PRIORITIES: Record<IngredientType, number> = {
  juice: 0,
  syrup: 0,
  liqueur: 2,
  spirit: 2,
  puree: 0,
  sugar: 0,
  water: 0,
  bitter: 1,
  other: 1,
};

const sortCompare = (a: number, b: number) => {
  if (a === b) {
    return 0;
  }
  if (a < b) {
    return -1;
  }
  return 1;
};

/**
 * Sorts the ingredients true to the Death & Co's method.
 */
export default function sortIngredients(ingredients: RecipeIngredient[]) {
  // TODO: should convert units in case they're misaligned.

  return ingredients.sort((a, b) => {
    // Drop/Dash will go first. Too easy to spill!
    if (UNIT_PRIORITIES[a.quantity.unit] !== UNIT_PRIORITIES[b.quantity.unit]) {
      return sortCompare(
        UNIT_PRIORITIES[a.quantity.unit],
        UNIT_PRIORITIES[b.quantity.unit],
      );
    }

    // Same value ingredients, sort by quantity
    if (INGREDIENT_PRIORITIES[a.type] === INGREDIENT_PRIORITIES[b.type]) {
      // Quantities could use different units, so compare them on a baseline of ml.
      return sortCompare(
        convertQuantityToMl(a.quantity).amount,
        convertQuantityToMl(b.quantity).amount,
      );
    }

    // Otherwise lowest value first; ex: juices & syrup first.
    return sortCompare(INGREDIENT_PRIORITIES[a.type], INGREDIENT_PRIORITIES[b.type]);
  });
}
