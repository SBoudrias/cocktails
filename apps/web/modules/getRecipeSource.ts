import type { Recipe } from '@cocktails/data';
import { match } from 'ts-pattern';

export function getRecipeSource(recipe: Recipe): string {
  return match(recipe.source)
    .with({ type: 'book' }, ({ name }) =>
      [name, recipe.chapter?.name].filter(Boolean).join(' · '),
    )
    .with({ type: 'youtube-channel' }, ({ name }) => name)
    .with({ type: 'podcast' }, ({ name }) => name)
    .exhaustive();
}
