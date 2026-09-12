import type { Recipe } from '@cocktails/data';
import { describe, expect, it } from 'vitest';
import {
  getBatchVolumeMilliliters,
  getMilkClarificationContext,
  getMilkRatio,
} from './milkClarification';

const ingredient = (
  name: string,
  quantity: Recipe['ingredients'][number]['quantity'],
  technique?: Recipe['ingredients'][number]['technique'],
): Recipe['ingredients'][number] => ({
  name,
  slug: name,
  type: 'spirit',
  technique,
  quantity,
  categories: [],
  refs: [],
  ingredients: [],
});

const clarifiedNewYorkSourIngredients: Recipe['ingredients'] = [
  ingredient('Simple syrup', { amount: 4, unit: 'oz' }),
  ingredient('Lemon juice', { amount: 5, unit: 'oz' }),
  ingredient('Red Wine', { amount: 0.5, unit: 'oz' }),
  ingredient('Wild Turkey 101', { amount: 10, unit: 'oz' }),
];

const wholeMilkClarification = {
  technique: 'clarification',
  method: 'milk',
  milk_type: 'Whole milk',
  quantity: { amount: 5, unit: 'oz' },
} as const;

describe('getBatchVolumeMilliliters', () => {
  it('sums convertible ingredient volumes and skips unit-counted items', () => {
    const ingredients = [
      ...clarifiedNewYorkSourIngredients,
      ingredient('Lemon peel', { amount: 1, unit: 'unit' }),
    ];

    expect(getBatchVolumeMilliliters(ingredients)).toBe(19.5 * 30);
  });

  it('returns undefined when no ingredient has a measurable volume', () => {
    const ingredients = [ingredient('Lemon peel', { amount: 2, unit: 'unit' })];

    expect(getBatchVolumeMilliliters(ingredients)).toBeUndefined();
  });

  it('excludes finishes applied to the serving like a wine float or a soda top', () => {
    const ingredients = [
      ingredient('Bourbon', { amount: 2, unit: 'oz' }),
      ingredient('Lemon juice', { amount: 1, unit: 'oz' }),
      ingredient(
        'Red Wine',
        { amount: 0.5, unit: 'oz' },
        { technique: 'application', method: 'float' },
      ),
      ingredient('Grapefruit soda', { amount: 4, unit: 'oz' }, [
        { technique: 'application', method: 'top' },
      ]),
    ];

    // Only the bourbon and lemon juice count toward the batch
    expect(getBatchVolumeMilliliters(ingredients)).toBe(3 * 30);
  });
});

describe('getMilkRatio', () => {
  it('derives the recipe ratio from the milk quantity over the batch volume', () => {
    expect(
      getMilkRatio(wholeMilkClarification, clarifiedNewYorkSourIngredients),
    ).toBeCloseTo(150 / 585);
  });

  it('returns undefined when the milk cannot be measured as a volume', () => {
    expect(
      getMilkRatio(
        { ...wholeMilkClarification, quantity: { amount: 1, unit: 'unit' } },
        clarifiedNewYorkSourIngredients,
      ),
    ).toBeUndefined();
  });

  it('returns undefined when the milk exceeds the batch volume', () => {
    expect(
      getMilkRatio(
        { ...wholeMilkClarification, quantity: { amount: 30, unit: 'oz' } },
        clarifiedNewYorkSourIngredients,
      ),
    ).toBeUndefined();
  });
});

describe('getMilkClarificationContext', () => {
  it('expresses the batch volume in the preferred unit with the recipe ratio', () => {
    expect(
      getMilkClarificationContext({
        milkClarification: wholeMilkClarification,
        ingredients: clarifiedNewYorkSourIngredients,
        preferredUnit: 'oz',
      }),
    ).toEqual({
      batchQuantity: { amount: 19.5, unit: 'oz' },
      ratio: 150 / 585,
    });
  });

  it('keeps the batch in milliliters when it is the preferred unit', () => {
    expect(
      getMilkClarificationContext({
        milkClarification: wholeMilkClarification,
        ingredients: clarifiedNewYorkSourIngredients,
        preferredUnit: 'ml',
      }),
    ).toEqual({
      batchQuantity: { amount: 585, unit: 'ml' },
      ratio: 150 / 585,
    });
  });

  it('returns undefined when the batch volume is not measurable', () => {
    expect(
      getMilkClarificationContext({
        milkClarification: wholeMilkClarification,
        ingredients: [ingredient('Lemon peel', { amount: 2, unit: 'unit' })],
        preferredUnit: 'oz',
      }),
    ).toBeUndefined();
  });
});
