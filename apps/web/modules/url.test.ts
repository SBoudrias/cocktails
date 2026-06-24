import type { Recipe, RecipeIngredient } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import {
  getMilkClarificationCalculatorUrl,
  getRecipeEditUrl,
  getRecipeIngredientUrl,
} from './url';

describe('getMilkClarificationCalculatorUrl', () => {
  it('prefills only the canonical milk type', () => {
    expect(getMilkClarificationCalculatorUrl('Coconut milk')).toEqual({
      pathname: '/calculators/milk-clarification',
      query: { milkType: 'Coconut milk' },
    });
  });
});

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

function createIngredient(
  technique?: RecipeIngredient['technique'],
  quantity: RecipeIngredient['quantity'] = { amount: 1, unit: 'oz' },
): RecipeIngredient {
  return {
    name: 'Lime juice',
    slug: 'lime-juice',
    type: 'juice',
    quantity,
    technique,
    categories: [],
    refs: [],
    ingredients: [],
  };
}

describe('getRecipeIngredientUrl', () => {
  it('returns a plain ingredient URL without preparation context', () => {
    expect(getRecipeIngredientUrl(createIngredient())).toBe(
      '/ingredient/juice/lime-juice',
    );
  });

  it('includes the recipe quantity and generic clarification context', () => {
    expect(
      getRecipeIngredientUrl(
        createIngredient({ technique: 'clarification' }, { amount: 0.25, unit: 'oz' }),
      ),
    ).toEqual({
      pathname: '/ingredient/juice/lime-juice',
      query: {
        technique: ['clarification'],
        amount: '0.25',
        unit: 'oz',
      },
    });
  });

  it('distinguishes milk and agent-specific clarification', () => {
    expect(
      getRecipeIngredientUrl(
        createIngredient({ technique: 'clarification', method: 'milk' }),
      ),
    ).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ technique: ['clarification:milk'] }),
      }),
    );
    expect(
      getRecipeIngredientUrl(
        createIngredient({ technique: 'clarification', agent: 'Agar Agar' }),
      ),
    ).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ technique: ['clarification:agar-agar'] }),
      }),
    );
  });

  it('preserves multiple techniques as repeated context values', () => {
    expect(
      getRecipeIngredientUrl(
        createIngredient([
          { technique: 'temperature', method: 'chilled' },
          { technique: 'acid-adjustment' },
        ]),
      ),
    ).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({
          technique: ['temperature', 'acid-adjustment'],
          juiceAmount: '1',
        }),
      }),
    );
  });

  it('converts acid-adjusted recipe quantities to ounces', () => {
    expect(
      getRecipeIngredientUrl(
        createIngredient({ technique: 'acid-adjustment' }, { amount: 15, unit: 'ml' }),
      ),
    ).toEqual({
      pathname: '/ingredient/juice/lime-juice',
      query: {
        technique: ['acid-adjustment'],
        amount: '15',
        unit: 'ml',
        juiceAmount: '0.5',
      },
    });
  });

  it('omits juice amount for acid-adjusted non-volume quantities', () => {
    expect(
      getRecipeIngredientUrl(
        createIngredient({ technique: 'acid-adjustment' }, { amount: 100, unit: 'gram' }),
      ),
    ).toEqual({
      pathname: '/ingredient/juice/lime-juice',
      query: {
        technique: ['acid-adjustment'],
        amount: '100',
        unit: 'gram',
      },
    });
  });
});
