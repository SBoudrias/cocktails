import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { groupByName } from '#/modules/lists/groupByName';
import { getRecipeUrl } from '#/modules/url';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Indexotica | All Recipes',
};

// The static HTML holds whole letters, up to at least this many rows: enough
// to paint the first screens and for crawlers to reach the first recipes.
// The rest of the list comes from the shared search index.
const PRERENDERED_ROWS = 300;

export default async function RecipesPage() {
  const recipes = await getAllRecipes();
  const groups = groupByName(
    recipes.map((recipe) => ({
      href: getRecipeUrl(recipe),
      name: recipe.name,
      source: getRecipeSource(recipe),
    })),
  );

  const prerenderedGroups = groups.filter(
    (_, index) =>
      groups.slice(0, index).reduce((rows, group) => rows + group.items.length, 0) <
      PRERENDERED_ROWS,
  );

  return (
    <RecipesClient
      groups={groups.map((group) => ({ label: group.label, count: group.items.length }))}
      initialRecipes={prerenderedGroups.flatMap((group) => group.items)}
    />
  );
}
