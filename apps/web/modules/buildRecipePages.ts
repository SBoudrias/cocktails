import type { Category, Recipe, RecipeIngredient, Source } from '@cocktails/data';
import { getAllRecipes } from '@cocktails/data/recipes';
import { serializePageData, toSortedRecord } from '#/modules/pageDataFile';
import { getRecipeUrl } from '#/modules/url';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An ingredient as a recipe page shows it, without the fields of its use in
 * one recipe (quantity, technique, brix, optional): its name, type and slug,
 * and its categories' names. The fields recipe pages never read are dropped
 * or emptied, since the same bottles and categories appear in hundreds of
 * recipes: descriptions, refs, acidity, a bottle's own ingredients and
 * instructions, and category parents.
 */
type StoredIngredient = DistributiveOmit<
  RecipeIngredient,
  'quantity' | 'technique' | 'brix' | 'optional'
>;

/**
 * One ingredient line of a recipe: its `ingredients` key, then the fields
 * of its use in the recipe.
 */
type StoredRecipeIngredient = [
  ingredient: string,
  use: Pick<RecipeIngredient, 'quantity' | 'technique' | 'brix' | 'optional'>,
];

/**
 * One recipe page's own entry: the recipe, its ingredient lines and source
 * resolved against the file's shared tables. The title and description are
 * the page's head, set once the entry renders.
 */
type RecipePageEntry = {
  title: string;
  description: string;
  recipe: Omit<Recipe, 'ingredients' | 'source'> & {
    ingredients: StoredRecipeIngredient[];
    /** The `sources` key. */
    source: string;
  };
};

/**
 * data/recipes.json: every recipe page's entry keyed by its path
 * (`getRecipeUrl`), and the ingredients and sources those entries name,
 * each stored once.
 */
export type RecipePagesFile = {
  pages: Record<string, RecipePageEntry>;
  ingredients: Record<string, StoredIngredient>;
  sources: Record<string, Source>;
};

const toIngredientKey = ({ type, slug }: { type: string; slug: string }) =>
  `${type}/${slug}`;
const toSourceKey = ({ type, slug }: Source) => `${type}/${slug}`;

function toStoredCategory({ name, slug, categoryType, type }: Category): Category {
  return categoryType == null
    ? { name, slug, type, parents: [], refs: [] }
    : { name, slug, categoryType, type, parents: [], refs: [] };
}

function toStoredIngredient(ingredient: RecipeIngredient): StoredIngredient {
  if (ingredient.type === 'category') {
    return { ...toStoredCategory(ingredient), type: 'category' };
  }

  const { name, slug, type, categories } = ingredient;
  return {
    name,
    slug,
    type,
    refs: [],
    ingredients: [],
    categories: categories.map(toStoredCategory),
  };
}

function toStoredUse({
  quantity,
  technique,
  brix,
  optional,
}: RecipeIngredient): StoredRecipeIngredient[1] {
  return {
    quantity,
    ...(technique == null ? {} : { technique }),
    ...(brix == null ? {} : { brix }),
    ...(optional == null ? {} : { optional }),
  };
}

/**
 * Fold recipes into the pages file. Keys sort by code unit, so the
 * serialized output does not depend on input order or locale.
 */
export function buildRecipePages(recipes: Recipe[]): RecipePagesFile {
  const ingredients = new Map<string, StoredIngredient>();
  const sources = new Map<string, Source>();

  const pages = recipes.map((recipe) => {
    sources.set(toSourceKey(recipe.source), recipe.source);
    for (const ingredient of recipe.ingredients) {
      ingredients.set(toIngredientKey(ingredient), toStoredIngredient(ingredient));
    }

    const entry: RecipePageEntry = {
      title: `Indexotica | ${recipe.name} from ${recipe.source.name}`,
      description: `${recipe.name} cocktail recipe from ${recipe.source.name}: ${recipe.ingredients
        .map((ingredient) => ingredient.name)
        .join(', ')}.`,
      recipe: {
        ...recipe,
        source: toSourceKey(recipe.source),
        ingredients: recipe.ingredients.map((ingredient) => [
          toIngredientKey(ingredient),
          toStoredUse(ingredient),
        ]),
      },
    };

    return [getRecipeUrl(recipe), entry] as const;
  });

  return {
    pages: toSortedRecord(pages),
    ingredients: toSortedRecord(ingredients),
    sources: toSortedRecord(sources),
  };
}

/** Every recipe page's data, serialized minified for `fetch`. */
export async function getSerializedRecipePages(): Promise<string> {
  return serializePageData(buildRecipePages(await getAllRecipes()));
}
