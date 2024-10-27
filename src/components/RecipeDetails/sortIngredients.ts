import { convertQuantityToMl } from '@/modules/conversion';
import { RecipeIngredient, IngredientType, Unit } from '@/types/Ingredient';

const UNIT_PRIORITIES: Record<Unit, number> = {
  unit: 0,
  drop: 0,
  dash: 1,
  tsp: 2,
  tbsp: 2,
  oz: 2,
  ml: 2,
};

const INGREDIENT_PRIORITIES: Record<IngredientType, number> = {
  fruit: 0,
  juice: 1,
  syrup: 1,
  liqueur: 3,
  spirit: 3,
  category: 3,
  puree: 1,
  sugar: 1,
  bitter: 2,
  other: 2,
  soda: 4,
  spice: 4,
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
