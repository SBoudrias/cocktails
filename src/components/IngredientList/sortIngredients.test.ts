import { describe, it, expect } from 'vitest';
import { type RecipeIngredient } from '@/types/Ingredient';
import sortIngredients from './sortIngredients';

function createTestIngredient(
  partial: Omit<Partial<RecipeIngredient>, 'quantity'> & {
    quantity?: Partial<RecipeIngredient['quantity']>;
    categoryType?: RecipeIngredient['type'];
  } = {},
): RecipeIngredient {
  const defaults: RecipeIngredient = {
    name: 'Test Ingredient',
    slug: 'test-ingredient',
    type: 'spirit',
    categories: [],
    refs: [],
    ingredients: [],
    quantity: { amount: 1, unit: 'oz' },
  };

  return {
    ...defaults,
    ...partial,
    quantity: {
      ...defaults.quantity,
      ...partial.quantity,
    },
  } as RecipeIngredient;
}

describe('sortIngredients', () => {
  it('should sort ingredients by unit priority', () => {
    const ingredients = [
      createTestIngredient({ quantity: { unit: 'unit' } }),
      createTestIngredient({ quantity: { unit: 'drop' } }),
      createTestIngredient({ quantity: { unit: 'tsp' } }),
      createTestIngredient({ quantity: { unit: 'ml' } }),
      createTestIngredient({ quantity: { unit: 'spray' } }),
      createTestIngredient({ quantity: { unit: 'dash' } }),
      createTestIngredient({ quantity: { unit: 'tbsp' } }),
      createTestIngredient({ quantity: { unit: 'oz' } }),
      createTestIngredient({ quantity: { unit: 'gram' } }),
      createTestIngredient({ quantity: { unit: 'pinch' } }),
      createTestIngredient({ quantity: { unit: 'bottle' } }),
    ];

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      createTestIngredient({ quantity: { unit: 'unit' } }),
      createTestIngredient({ quantity: { unit: 'spray' } }),
      createTestIngredient({ quantity: { unit: 'drop' } }),
      createTestIngredient({ quantity: { unit: 'dash' } }),
      createTestIngredient({ quantity: { unit: 'gram' } }),
      createTestIngredient({ quantity: { unit: 'ml' } }),
      createTestIngredient({ quantity: { unit: 'tsp' } }),
      createTestIngredient({ quantity: { unit: 'tbsp' } }),
      createTestIngredient({ quantity: { unit: 'oz' } }),
      createTestIngredient({ quantity: { unit: 'pinch' } }),
      createTestIngredient({ quantity: { unit: 'bottle' } }),
    ]);
  });

  it('should sort ingredients by ingredient priority', () => {
    const ingredients = [
      createTestIngredient({ type: 'soda' }),
      createTestIngredient({ type: 'liqueur' }),
      createTestIngredient({ type: 'juice' }),
    ];

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      createTestIngredient({ type: 'juice' }),
      createTestIngredient({ type: 'liqueur' }),
      createTestIngredient({ type: 'soda' }),
    ]);
  });

  it('should sort ingredients by quantity', () => {
    const ingredients = [
      createTestIngredient({ quantity: { amount: 1, unit: 'oz' } }),
      createTestIngredient({ quantity: { amount: 2, unit: 'oz' } }),
      createTestIngredient({ quantity: { amount: 1, unit: 'oz' } }),
    ];

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      createTestIngredient({ quantity: { amount: 1, unit: 'oz' } }),
      createTestIngredient({ quantity: { amount: 1, unit: 'oz' } }),
      createTestIngredient({ quantity: { amount: 2, unit: 'oz' } }),
    ]);
  });

  describe('application techniques', () => {
    it('should sort rinse first', () => {
      const ingredients = [
        createTestIngredient(),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'rinse' },
        }),
        createTestIngredient({ type: 'juice' }),
      ];

      const result = sortIngredients(ingredients);

      expect(result[0]).toEqual(
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'rinse' },
        }),
      );
    });

    it('should sort float last', () => {
      const ingredients = [
        createTestIngredient(),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'float' },
        }),
        createTestIngredient({ type: 'juice' }),
      ];

      const result = sortIngredients(ingredients);

      expect(result[result.length - 1]).toEqual(
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'float' },
        }),
      );
    });

    it('should sort top after rinse but before float', () => {
      const result = sortIngredients([
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'float' },
        }),
        createTestIngredient(),
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'top' },
        }),
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'rinse' },
        }),
      ]);

      expect(result).toEqual([
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'rinse' },
        }),
        createTestIngredient(),
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'float' },
        }),
        createTestIngredient({
          type: 'bitter',
          technique: { technique: 'application', method: 'top' },
        }),
      ]);
    });

    it('should handle ingredients with multiple techniques', () => {
      const result = sortIngredients([
        createTestIngredient(),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: [
            { technique: 'muddled' },
            { technique: 'application', method: 'float' },
          ],
        }),
        createTestIngredient({ type: 'juice' }),
      ]);

      expect(result[result.length - 1]).toEqual(
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: [
            { technique: 'muddled' },
            { technique: 'application', method: 'float' },
          ],
        }),
      );
    });

    it('should handle ingredients without application technique normally', () => {
      const result = sortIngredients([
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'muddled' },
        }),
        createTestIngredient({ type: 'juice' }),
        createTestIngredient(),
      ]);

      expect(result).toEqual([
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'muddled' },
        }),
        createTestIngredient({ type: 'juice' }),
        createTestIngredient(),
      ]);
    });

    it('should handle complete sorting order with all application techniques', () => {
      const result = sortIngredients([
        createTestIngredient({ quantity: { amount: 2, unit: 'oz' } }),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'bottle' },
          technique: { technique: 'application', method: 'float' },
        }),
        createTestIngredient({ type: 'juice' }),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 2, unit: 'dash' },
          technique: { technique: 'application', method: 'top' },
        }),
        createTestIngredient({ type: 'syrup', quantity: { amount: 0.5, unit: 'oz' } }),
        createTestIngredient({
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'rinse' },
        }),
      ]);

      const resultMethods = result.map((r) => {
        const technique = r.technique;
        if (Array.isArray(technique)) {
          const appTechnique = technique.find((t) => t.technique === 'application');
          return appTechnique && 'method' in appTechnique ? appTechnique.method : 'none';
        }
        return technique && 'method' in technique ? technique.method : 'none';
      });
      expect(resultMethods).toEqual(['rinse', 'none', 'none', 'none', 'float', 'top']);
    });
  });

  it('should sort categories by their categoryType against other ingredients', () => {
    const ingredients = [
      createTestIngredient({ type: 'spirit' }),
      createTestIngredient({ type: 'category', categoryType: 'juice' }),
      createTestIngredient({ type: 'soda' }),
      createTestIngredient({ type: 'category', categoryType: 'spirit' }),
      createTestIngredient({ type: 'juice' }),
      createTestIngredient({ type: 'category' }), // no categoryType, defaults to 'category'
    ];

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      createTestIngredient({ type: 'category', categoryType: 'juice' }),
      createTestIngredient({ type: 'juice' }),
      createTestIngredient({ type: 'spirit' }),
      createTestIngredient({ type: 'category', categoryType: 'spirit' }),
      createTestIngredient({ type: 'category' }),
      createTestIngredient({ type: 'soda' }),
    ]);
  });
});
