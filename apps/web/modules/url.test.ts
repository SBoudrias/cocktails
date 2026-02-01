import type { Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import { getRecipeEditUrl } from './url';

const createRecipe = (
  slug: string,
  source: { type: string; slug: string },
  chapter?: { order: number; name: string },
): Recipe =>
  ({
    slug,
    source: { type: source.type, slug: source.slug },
    chapter,
  }) as Recipe;

describe('getRecipeEditUrl', () => {
  it('returns URL without chapter for flat recipes', () => {
    const recipe = createRecipe('mojito', { type: 'book', slug: 'cocktail-codex' });

    expect(getRecipeEditUrl(recipe)).toBe(
      'https://github.com/SBoudrias/cocktails/edit/main/packages/data/data/recipes/book/cocktail-codex/mojito.json',
    );
  });

  it('returns URL with chapter folder for chapter recipes', () => {
    const recipe = createRecipe(
      'zombie',
      { type: 'book', slug: 'smugglers-cove' },
      { order: 5, name: 'Zombie' },
    );

    expect(getRecipeEditUrl(recipe)).toBe(
      'https://github.com/SBoudrias/cocktails/edit/main/packages/data/data/recipes/book/smugglers-cove/05_Zombie/zombie.json',
    );
  });

  it('pads single digit chapter order with leading zero', () => {
    const recipe = createRecipe(
      'test',
      { type: 'book', slug: 'test-book' },
      { order: 1, name: 'First' },
    );

    expect(getRecipeEditUrl(recipe)).toContain('/01_First/');
  });

  it('handles double digit chapter order', () => {
    const recipe = createRecipe(
      'test',
      { type: 'book', slug: 'test-book' },
      { order: 12, name: 'Twelfth' },
    );

    expect(getRecipeEditUrl(recipe)).toContain('/12_Twelfth/');
  });

  it('encodes special characters in chapter name', () => {
    const recipe = createRecipe(
      'test',
      { type: 'book', slug: 'test-book' },
      { order: 1, name: 'Chapter & More' },
    );

    expect(getRecipeEditUrl(recipe)).toContain(encodeURIComponent('01_Chapter & More'));
  });
});
