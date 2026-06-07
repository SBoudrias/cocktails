import { describe, expect, it } from 'vitest';
import { findFloatingIngredients } from './floating-ingredients.ts';

const ingredients = [
  {
    name: 'Lime juice',
    type: 'juice',
    slug: 'lime-juice',
    filepath: '/ingredients/juice/lime-juice.json',
  },
  {
    name: 'Unused syrup',
    type: 'syrup',
    slug: 'unused-syrup',
    filepath: '/ingredients/syrup/unused-syrup.json',
  },
  {
    name: 'Alternative rum',
    type: 'spirit',
    slug: 'alternative-rum',
    filepath: '/ingredients/spirit/alternative-rum.json',
  },
  {
    name: 'Alternative curaçao',
    type: 'liqueur',
    slug: 'alternative-curacao',
    filepath: '/ingredients/liqueur/alternative-curacao.json',
  },
];

describe('findFloatingIngredients', () => {
  it('finds unreferenced ingredients while ignoring spirits and liqueurs', () => {
    const floatingIngredients = findFloatingIngredients(
      ingredients,
      new Set(['lime-juice']),
    );

    expect(floatingIngredients).toEqual([
      {
        name: 'Unused syrup',
        type: 'syrup',
        slug: 'unused-syrup',
        filepath: '/ingredients/syrup/unused-syrup.json',
      },
    ]);
  });
});
