import { describe, expect, it } from 'vitest';
import {
  findDuplicateRecipePairs,
  type CategoryIndex,
  type RecipeEntry,
} from './duplicate-recipes.ts';

const index: CategoryIndex = {
  categoryNamesLower: new Set(['amaretto', 'tequila reposado', 'aromatic bitters']),
  ingredientFirstCategory: new Map([
    ['lazzaroni amaretto', 'amaretto'],
    ['siete leguas reposado tequila', 'tequila reposado'],
    ['fee brothers whiskey barrel-aged bitters', 'aromatic bitters'],
  ]),
};

function recipe(file: string, overrides: Partial<RecipeEntry> = {}): RecipeEntry {
  return {
    file,
    name: 'Almond Brother',
    attributions: [
      { relation: 'recipe author', source: 'Jason Littrell' },
      { relation: 'bar', source: 'Death & Co' },
    ],
    ingredients: [
      { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
      { name: 'Lazzaroni Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
    ],
    ...overrides,
  };
}

describe('findDuplicateRecipePairs', () => {
  it('flags the same drink transcribed under two sources', () => {
    const book = recipe(
      'data/recipes/book/death-and-co/06_Agave Shaken/almond-brother.json',
    );
    const channel = recipe(
      'data/recipes/youtube-channel/make-and-drink/almond-brother.json',
      {
        // The channel copy names the generic category, the book names the
        // specific bottle — same drink once bottles collapse to categories.
        ingredients: [
          { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
          { name: 'Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
        ],
      },
    );

    expect(findDuplicateRecipePairs([book, channel], index)).toEqual([
      {
        name: 'Almond Brother',
        fileA: book.file,
        fileB: channel.file,
        sharedAttributions: ['recipe author: Jason Littrell', 'bar: Death & Co'],
      },
    ]);
  });

  it('ignores same-name recipes with no attribution in common', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      attributions: [{ relation: 'recipe author', source: 'Alice' }],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      attributions: [{ relation: 'recipe author', source: 'Bob' }],
    });

    expect(findDuplicateRecipePairs([a, b], index)).toEqual([]);
  });

  it('flags a transcription that renames a bottle (brandless vs branded)', () => {
    // Old Ironsides case: the video names the bitters brandlessly, the book
    // names the Fee Brothers product — same quantities, same drink.
    const book = recipe(
      'data/recipes/book/death-and-co/05_Rum Stirred/old-ironsides.json',
      {
        ingredients: [
          {
            name: 'Fee Brothers Whiskey Barrel-Aged Bitters',
            quantity: { amount: 1, unit: 'dash' },
          },
          { name: 'Lazzaroni Amaretto', quantity: { amount: 1, unit: 'tsp' } },
        ],
      },
    );
    const channel = recipe(
      'data/recipes/youtube-channel/make-and-drink/old-ironsides.json',
      {
        ingredients: [
          { name: 'Whiskey Barrel-Aged Bitters', quantity: { amount: 1, unit: 'dash' } },
          { name: 'Lazzaroni Amaretto', quantity: { amount: 1, unit: 'tsp' } },
        ],
      },
    );

    expect(findDuplicateRecipePairs([book, channel], index)).toHaveLength(1);
  });

  it('flags one swapped bottle within the same category when quantities match', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        { name: 'Lazzaroni Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        { name: 'Disaronno Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });
    const bothBottlesMapped: CategoryIndex = {
      ...index,
      ingredientFirstCategory: new Map(index.ingredientFirstCategory).set(
        'disaronno amaretto',
        'amaretto',
      ),
    };

    expect(findDuplicateRecipePairs([a, b], bothBottlesMapped)).toHaveLength(1);
  });

  it('also surfaces one swapped bottle when every quantity matches', () => {
    // At the same quantities, a bottle swap (two unmatched names) can be a
    // transcription using the house bottle or a substitution — the check is
    // warning-level, so it surfaces the pair for review rather than staying
    // quiet and missing a rename like the Old Ironsides brandless bitters.
    const a = recipe('data/recipes/book/a/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        { name: 'Lazzaroni Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        {
          name: 'Siete Leguas Reposado Tequila',
          quantity: { amount: 0.25, unit: 'oz' },
        },
      ],
    });

    expect(findDuplicateRecipePairs([a, b], index)).toHaveLength(1);
  });

  it('ignores a different take on the same drink (quantities differ)', () => {
    const a = recipe('data/recipes/book/a/recipe.json');
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.5, unit: 'oz' } },
        { name: 'Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });

    expect(findDuplicateRecipePairs([a, b], index)).toEqual([]);
  });

  it('ignores the same drink filed under a distinct display name', () => {
    const a = recipe('data/recipes/book/a/recipe.json');
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      name: 'Almond Brother (Make and Drink)',
    });

    expect(findDuplicateRecipePairs([a, b], index)).toEqual([]);
  });

  it('ignores two bottles swapped for two others, even at equal quantities', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        { name: 'Lazzaroni Amaretto', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        { name: 'Honey syrup', quantity: { amount: 0.25, unit: 'oz' } },
        {
          name: 'Siete Leguas Reposado Tequila',
          quantity: { amount: 0.25, unit: 'oz' },
        },
      ],
    });

    // Four unmatched names — a different drink, not a transcription.
    expect(findDuplicateRecipePairs([a, b], index)).toEqual([]);
  });

  it('treats a matching amount range as the same quantity', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        {
          name: 'Lazzaroni Amaretto',
          quantity: { amount: 0.25, unit: 'oz', maximum: 0.5 },
        },
      ],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        {
          name: 'Amaretto',
          quantity: { amount: 0.25, unit: 'oz', maximum: 0.5 },
        },
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });

    expect(findDuplicateRecipePairs([a, b], index)).toHaveLength(1);
  });

  it('separates drinks whose ranges differ', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      ingredients: [
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
        {
          name: 'Lazzaroni Amaretto',
          quantity: { amount: 0.25, unit: 'oz', maximum: 0.5 },
        },
      ],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      ingredients: [
        {
          name: 'Amaretto',
          quantity: { amount: 0.25, unit: 'oz', maximum: 0.75 },
        },
        { name: 'Orgeat', quantity: { amount: 0.25, unit: 'oz' } },
      ],
    });

    expect(findDuplicateRecipePairs([a, b], index)).toEqual([]);
  });

  it('is case-insensitive on names and attributions', () => {
    const a = recipe('data/recipes/book/a/recipe.json', {
      attributions: [{ relation: 'Recipe Author', source: 'jason littrell' }],
    });
    const b = recipe('data/recipes/youtube-channel/b/recipe.json', {
      name: 'almond brother',
    });

    expect(findDuplicateRecipePairs([a, b], index)).toHaveLength(1);
  });
});
