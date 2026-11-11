import type { Recipe, RecipeIngredient } from '@cocktails/data';
import { getAllAuthors } from '@cocktails/data/authors';
import { getAllBars } from '@cocktails/data/bars';
import { getAllCategories, getChildCategories } from '@cocktails/data/categories';
import { getAllIngredients, getRecipesForIngredient } from '@cocktails/data/ingredients';
import {
  getNonAlcoholicRecipes,
  getRecipeByCategory,
  getRecipesByAuthor,
  getRecipesByBar,
} from '@cocktails/data/recipes';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { getRecipeUrl } from '#/modules/url';

/**
 * What a card renders: the list-item projection's display fields. `chapter`
 * and `page` are not here: only book source pages group by them, and those
 * pages keep their lists baked.
 */
type CatalogCard = [name: string, source: string];

/**
 * One row of an ingredient/category page's list: the recipe's href, and the
 * quantity of that page's ingredient in it (`null` when the data lacks one —
 * the render guard against that drops the quantity, not the row).
 */
type CatalogEntry = [href: string, quantity: RecipeIngredient['quantity'] | null];

/**
 * The recipe lists of every list-driven page, keyed the way those pages
 * address them (`category/<slug>`, `ingredient/<type>/<slug>`,
 * `list/authors/<slug>`, `list/bars/<slug>`). Like the search index, entries
 * and cards are keyed by recipe href, so a page and a catalog built from
 * slightly different data still agree on whatever hrefs they share (deploy
 * skew between the two files).
 */
export type Catalog = {
  cards: Record<string, CatalogCard>;
  lists: Record<string, CatalogEntry[]>;
};

/**
 * A list to fold into the catalog: the page's key, its recipes in the order
 * the page renders them, and how to pick each recipe's quantity for that
 * page.
 */
type CatalogListInput = {
  key: string;
  recipes: Recipe[];
  pickQuantity: (recipe: Recipe) => RecipeIngredient['quantity'] | undefined;
};

/**
 * The quantity of the category (or one of its child categories, or a bottle
 * of it) in a recipe — what a category page's cards display.
 */
export function getCategoryQuantityPicker(
  category: { slug: string },
  childCategories: { slug: string }[],
): (recipe: Recipe) => RecipeIngredient['quantity'] | undefined {
  const categorySlugs = new Set([category.slug, ...childCategories.map((c) => c.slug)]);

  return (recipe) =>
    recipe.ingredients.find((ingredient) => {
      if (ingredient.type === 'category') {
        return ingredient.slug === category.slug;
      }
      return ingredient.categories.some((c) => categorySlugs.has(c.slug));
    })?.quantity;
}

/**
 * The quantity of the ingredient in a recipe — what an ingredient page's
 * cards display. Recipes reaching the page only through a technique (e.g.
 * milk clarification) have no ingredient line, so the picker can miss them.
 */
export function getIngredientQuantityPicker(ingredient: {
  slug: string;
}): (recipe: Recipe) => RecipeIngredient['quantity'] | undefined {
  return (recipe) => recipe.ingredients.find((i) => i.slug === ingredient.slug)?.quantity;
}

function toSortedRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).toSorted(([a], [b]) => {
      if (a === b) return 0;
      return a < b ? -1 : 1;
    }),
  );
}

/**
 * Fold list inputs into a catalog: each list's recipes become card entries
 * (deduplicated by href, the same recipe appears on many pages) and its
 * quantities stay per-list. Keys sort by code unit so the serialized output
 * does not depend on input order or locale.
 */
export function buildCatalog(listInputs: CatalogListInput[]): Catalog {
  const cards: Record<string, CatalogCard> = {};
  const lists: Record<string, CatalogEntry[]> = {};

  for (const { key, recipes, pickQuantity } of listInputs) {
    for (const recipe of recipes) {
      cards[getRecipeUrl(recipe)] ??= [recipe.name, getRecipeSource(recipe)];
    }

    lists[key] = recipes.map((recipe) => [
      getRecipeUrl(recipe),
      pickQuantity(recipe) ?? null,
    ]);
  }

  return { cards: toSortedRecord(cards), lists: toSortedRecord(lists) };
}

/**
 * The catalog of every catalog-driven page, serialized minified — the file is
 * only ever read by `fetch`.
 */
export async function getSerializedCatalog(): Promise<string> {
  const [categories, ingredients, authors, bars] = await Promise.all([
    getAllCategories(),
    getAllIngredients(),
    getAllAuthors(),
    getAllBars(),
  ]);

  const [categoryLists, ingredientLists, curatedLists, authorLists, barLists] =
    await Promise.all([
      Promise.all(
        categories.map(async (category) => {
          const [recipes, childCategories] = await Promise.all([
            getRecipeByCategory(category),
            getChildCategories(category),
          ]);

          return {
            key: `category/${category.slug}`,
            recipes,
            pickQuantity: getCategoryQuantityPicker(category, childCategories),
          };
        }),
      ),
      Promise.all(
        ingredients.map(async (ingredient) => {
          const recipes = await getRecipesForIngredient(ingredient);

          return {
            key: `ingredient/${ingredient.type}/${ingredient.slug}`,
            recipes,
            pickQuantity: getIngredientQuantityPicker(ingredient),
          };
        }),
      ),
      Promise.all([
        getNonAlcoholicRecipes().then((recipes) => ({
          key: 'list/non-alcoholic',
          recipes,
          // The curated list pages show no per-recipe quantity.
          pickQuantity: () => undefined,
        })),
      ]),
      // Entity files cover the author and bar pages that list recipes —
      // check-data fails on a credit with no entity file. Author and bar cards
      // show no per-recipe quantity, so their lists carry none.
      Promise.all(
        authors.map(async (author) => ({
          key: `list/authors/${author.slug}`,
          recipes: await getRecipesByAuthor(author),
          pickQuantity: () => undefined,
        })),
      ),
      Promise.all(
        bars.map(async (bar) => ({
          key: `list/bars/${bar.slug}`,
          recipes: await getRecipesByBar(bar),
          pickQuantity: () => undefined,
        })),
      ),
    ]);

  const catalog = buildCatalog(
    [
      ...categoryLists,
      ...ingredientLists,
      ...curatedLists,
      ...authorLists,
      ...barLists,
    ].filter((list) => list.recipes.length > 0),
  );

  return JSON.stringify(catalog);
}
