import { convertQuantityToMl } from '@/modules/conversion';
import { IngredientType } from '@/types/Ingredient';
import { Recipe, Unit } from '@/types/Recipe';

const UNIT_PRIORITIES: Record<Unit, number> = {
  spray: 0,
  unit: 1,
  drop: 1,
  dash: 2,
  gram: 3,
  tsp: 4,
  tbsp: 4,
  oz: 4,
  ml: 4,
  pinch: 5,
  bottle: 5,
};

const INGREDIENT_PRIORITIES: Record<IngredientType | 'category', number> = {
  fruit: 0,
  juice: 1,
  syrup: 1,
  puree: 1,
  tincture: 2,
  bitter: 2,
  other: 2,
  liqueur: 3,
  spirit: 3,
  category: 3,
  soda: 4,
  beer: 4,
  spice: 4,
  wine: 4,
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
export default function sortIngredients<
  T extends Pick<Recipe['ingredients'][number], 'quantity' | 'type'>,
>(ingredients: readonly T[]): T[] {
  return ingredients.toSorted((a, b) => {
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
