/**
 * Ingredient sorting logic shared between UI and data validation.
 * Follows Death & Co's method: application techniques first/last,
 * then by unit priority, ingredient type, and quantity.
 */

type Quantity = {
  amount: number;
  unit: string;
};

type Technique = {
  technique: string;
  method?: string;
};

export type SortableIngredient = {
  type: string;
  categoryType?: string;
  quantity: Quantity;
  technique?: Technique | Technique[];
};

export const UNIT_PRIORITIES: Record<string, number> = {
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

export const INGREDIENT_PRIORITIES: Record<string, number> = {
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

export const APPLICATION_PRIORITIES: Record<string, number> = {
  rinse: -1,
  float: 1,
  top: 2,
};

const IMPERIAL_TO_ML: Record<string, number> = {
  tsp: 5,
  tbsp: 15,
  oz: 30,
  cup: 240,
};

export function convertQuantityToMl(quantity: Quantity): Quantity {
  if (quantity.unit in IMPERIAL_TO_ML) {
    return {
      amount: quantity.amount * IMPERIAL_TO_ML[quantity.unit]!,
      unit: 'ml',
    };
  }
  return quantity;
}

export function getApplicationTechniquePriority(
  technique?: Technique | Technique[],
): number {
  if (!technique) return 0;

  const techniques = Array.isArray(technique) ? technique : [technique];
  const applicationTechnique = techniques.find((t) => t.technique === 'application');

  if (applicationTechnique && applicationTechnique.method) {
    return APPLICATION_PRIORITIES[applicationTechnique.method] ?? 0;
  }
  return 0;
}

/**
 * Compare function for sorting ingredients.
 * Can be used with Array.prototype.toSorted().
 */
export function compareIngredients(a: SortableIngredient, b: SortableIngredient): number {
  // Handle application techniques first: rinse goes first, top goes last
  const aAppPriority = getApplicationTechniquePriority(a.technique);
  const bAppPriority = getApplicationTechniquePriority(b.technique);
  if (aAppPriority !== bAppPriority) {
    return aAppPriority - bAppPriority;
  }

  // Drop/Dash will go first. Too easy to spill!
  const aUnitPriority = UNIT_PRIORITIES[a.quantity.unit] ?? 4;
  const bUnitPriority = UNIT_PRIORITIES[b.quantity.unit] ?? 4;
  if (aUnitPriority !== bUnitPriority) {
    return aUnitPriority - bUnitPriority;
  }

  // Resolve effective type for categories
  const aType = a.type === 'category' ? (a.categoryType ?? 'category') : a.type;
  const bType = b.type === 'category' ? (b.categoryType ?? 'category') : b.type;

  const aIngredientPriority = INGREDIENT_PRIORITIES[aType] ?? 3;
  const bIngredientPriority = INGREDIENT_PRIORITIES[bType] ?? 3;

  // Same value ingredients, sort by quantity
  if (aIngredientPriority === bIngredientPriority) {
    const aMl = convertQuantityToMl(a.quantity).amount;
    const bMl = convertQuantityToMl(b.quantity).amount;
    return aMl - bMl;
  }

  // Otherwise lowest value first; ex: juices & syrup first.
  return aIngredientPriority - bIngredientPriority;
}
