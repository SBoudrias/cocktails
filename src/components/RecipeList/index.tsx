import { getRecipeUrl } from '@/modules/url';
import type { Recipe } from '@/types/Recipe';
import { match } from 'ts-pattern';
import { LinkList, LinkListItem } from '../LinkList';

const ATTRIBUTION_PRIORITY = ['adapted by', 'recipe author', 'book', 'bar'];

/**
 * Returns the attribution string for a recipe based on priority.
 * Use this when you need custom secondary content but want to fall back
 * to the default attribution behavior for some recipes.
 */
export function getRecipeAttribution(recipe: Recipe): string | undefined {
  let attribution = null;
  for (const attr of recipe.attributions) {
    const currentPriority = ATTRIBUTION_PRIORITY.indexOf(attr.relation);
    if (currentPriority === -1) continue;

    if (!attribution) {
      attribution = attr;
    } else {
      const savedPriority = ATTRIBUTION_PRIORITY.indexOf(attribution.relation);
      if (currentPriority < savedPriority) {
        attribution = attr;
      }
    }
  }

  const bookName = recipe.source.type === 'book' ? recipe.source.name : undefined;

  return match(attribution)
    .with(null, () => recipe.source.name)
    .with({ relation: 'adapted by' }, ({ source }) =>
      [source, bookName].filter(Boolean).join(' | '),
    )
    .with({ relation: 'recipe author' }, ({ source }) =>
      [source, bookName].filter(Boolean).join(' | '),
    )
    .with({ relation: 'bar' }, ({ source }) => bookName || `served at ${source}`)
    .with({ relation: 'book' }, ({ source }) => source)
    .exhaustive();
}

function defaultRenderRecipe(recipe: Recipe) {
  return (
    <LinkListItem key={recipe.slug} href={getRecipeUrl(recipe)} primary={recipe.name} />
  );
}

export default function RecipeList({
  recipes,
  header,
  renderRecipe = defaultRenderRecipe,
}: {
  recipes: Recipe[];
  header?: string;
  renderRecipe?: (recipe: Recipe) => React.ReactNode;
}) {
  return <LinkList items={recipes} header={header} renderItem={renderRecipe} />;
}
