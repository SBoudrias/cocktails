import { describe, expect, it } from 'vitest';

describe('getAllSources', () => {
  it('reports a recipeAmount matching the recipes listed for each source', async () => {
    const { getAllSources } = await import('./sources');
    const { getRecipesFromSource } = await import('./recipes');

    for (const source of await getAllSources()) {
      const recipes = await getRecipesFromSource(source);

      expect(source.recipeAmount, source.slug).toBe(recipes.length);
    }
  });
});
