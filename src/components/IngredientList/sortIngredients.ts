import type { RecipeIngredient } from '@/types/Ingredient';
import { convertQuantityToMl } from '@/modules/conversion';

const UNIT_PRIORITIES: Record<RecipeIngredient['quantity']['unit'], number> = {
  spray: 0,
  unit: 0,
  drop: 1,
  dash: 2,
  gram: 3,
  ml: 4,
  tsp: 4,
  tbsp: 4,
  oz: 4,
  cup: 4,
  pinch: 5,
  bottle: 5,
  part: 5,
};

const INGREDIENT_PRIORITIES: Record<RecipeIngredient['type'], number> = {
  fruit: 0,
  juice: 1,
  syrup: 1,
  puree: 1,
  other: 1,
  tincture: 2,
  bitter: 2,
  liqueur: 3,
  spirit: 3,
  category: 3,
  soda: 4,
  beer: 4,
  spice: 4,
  wine: 4,
  emulsifier: 5,
};

function getIngredientType(ingredient: RecipeIngredient) {
  return ingredient.type === 'category'
    ? (ingredient.categoryType ?? ingredient.type)
    : ingredient.type;
}

const APPLICATION_PRIORITIES: Record<'rinse' | 'top' | 'float', number> = {
  rinse: -1,
  float: 1,
  top: 2,
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

const getApplicationTechniquePriority = (
  ingredient: Pick<RecipeIngredient, 'technique'>,
): number => {
  if (!ingredient.technique) return 0;

  const techniques = Array.isArray(ingredient.technique)
    ? ingredient.technique
    : [ingredient.technique];
  const applicationTechnique = techniques.find((t) => t.technique === 'application');

  if (applicationTechnique) {
    return APPLICATION_PRIORITIES[applicationTechnique.method];
  }
  return 0; // Normal sorting for other techniques (no application)
};

/**
 * Sorts the ingredients true to the Death & Co's method.
 */
export default function sortIngredients<T extends RecipeIngredient>(
  ingredients: readonly T[],
): T[] {
  return ingredients.toSorted((a, b) => {
    // Handle application techniques first: rinse goes first, top goes last
    const aAppPriority = getApplicationTechniquePriority(a);
    const bAppPriority = getApplicationTechniquePriority(b);
    if (aAppPriority !== bAppPriority) {
      return sortCompare(aAppPriority, bAppPriority);
    }

    // Drop/Dash will go first. Too easy to spill!
    if (UNIT_PRIORITIES[a.quantity.unit] !== UNIT_PRIORITIES[b.quantity.unit]) {
      return sortCompare(
        UNIT_PRIORITIES[a.quantity.unit],
        UNIT_PRIORITIES[b.quantity.unit],
      );
    }

    // Same value ingredients, sort by quantity
    if (
      INGREDIENT_PRIORITIES[getIngredientType(a)] ===
      INGREDIENT_PRIORITIES[getIngredientType(b)]
    ) {
      // Quantities could use different units, so compare them on a baseline of ml.
      return sortCompare(
        convertQuantityToMl(a.quantity).amount,
        convertQuantityToMl(b.quantity).amount,
      );
    }

    // Otherwise lowest value first; ex: juices & syrup first.
    return sortCompare(
      INGREDIENT_PRIORITIES[getIngredientType(a)],
      INGREDIENT_PRIORITIES[getIngredientType(b)],
    );
  });
}
