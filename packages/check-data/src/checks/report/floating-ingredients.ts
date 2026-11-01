const IGNORED_FLOATING_INGREDIENT_TYPES = new Set(['spirit', 'liqueur']);

export function findFloatingIngredients(
  ingredients: ReadonlyArray<{
    name: string;
    type: string;
    slug: string;
    filepath: string;
  }>,
  referencedIngredientSlugs: ReadonlySet<string>,
) {
  return ingredients.filter(
    ({ type, slug }) =>
      !IGNORED_FLOATING_INGREDIENT_TYPES.has(type) &&
      !referencedIngredientSlugs.has(slug),
  );
}
