import slugify from '@sindresorhus/slugify';

type MilkClarificationTechnique = {
  technique: 'clarification';
  method: 'milk';
  milk_type: string;
  quantity: { amount: number; unit: string };
};

function getTechniques(recipe: {
  techniques?: MilkClarificationTechnique[];
}): MilkClarificationTechnique[] {
  return recipe.techniques ?? [];
}

export function getMilkClarificationIngredientSlugs(recipe: {
  techniques?: MilkClarificationTechnique[];
}): string[] {
  return getTechniques(recipe).map((technique) => slugify(technique.milk_type));
}

export function validateMilkClarification(
  recipe: {
    ingredients: Array<{ name: string }>;
    techniques?: MilkClarificationTechnique[];
  },
  canonicalNames: ReadonlyMap<string, string>,
  ingredientFolders: ReadonlyMap<string, string>,
): string[] {
  return getTechniques(recipe).flatMap((technique) => {
    const milkTypeSlug = slugify(technique.milk_type);
    const canonicalName = canonicalNames.get(milkTypeSlug);

    if (!canonicalName || !ingredientFolders.has(milkTypeSlug)) {
      return [`Milk type "${technique.milk_type}" is not a canonical ingredient`];
    }

    if (canonicalName !== technique.milk_type) {
      return [
        `Milk type "${technique.milk_type}" must use canonical ingredient name "${canonicalName}"`,
      ];
    }

    if (
      recipe.ingredients.some((ingredient) => slugify(ingredient.name) === milkTypeSlug)
    ) {
      return [
        `Milk type "${canonicalName}" must be defined only by the recipe technique, not listed as a recipe ingredient`,
      ];
    }

    return [];
  });
}
