import { describe, it, expect } from 'vitest';
import sortIngredients from './sortIngredients';

describe('sortIngredients', () => {
  it('should sort ingredients by unit priority', () => {
    const ingredients = [
      { type: 'spirit', quantity: { amount: 1, unit: 'unit' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'drop' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'tsp' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'ml' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'spray' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'dash' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'tbsp' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'gram' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'pinch' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'bottle' } },
    ] as const;

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      { type: 'spirit', quantity: { amount: 1, unit: 'unit' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'spray' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'drop' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'dash' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'gram' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'ml' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'tsp' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'tbsp' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'pinch' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'bottle' } },
    ]);
  });

  it('should sort ingredients by ingredient priority', () => {
    const ingredients = [
      { type: 'soda', quantity: { amount: 1, unit: 'unit' } },
      { type: 'liqueur', quantity: { amount: 1, unit: 'unit' } },
      { type: 'juice', quantity: { amount: 1, unit: 'unit' } },
    ] as const;

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      { type: 'juice', quantity: { amount: 1, unit: 'unit' } },
      { type: 'liqueur', quantity: { amount: 1, unit: 'unit' } },
      { type: 'soda', quantity: { amount: 1, unit: 'unit' } },
    ]);
  });

  it('should sort ingredients by quantity', () => {
    const ingredients = [
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 2, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
    ] as const;

    const result = sortIngredients(ingredients);

    expect(result).toEqual([
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 2, unit: 'oz' } },
    ]);
  });

  describe('application techniques', () => {
    it('should sort rinse first', () => {
      const ingredients = [
        { type: 'spirit' as const, quantity: { amount: 1, unit: 'oz' as const } },
        {
          type: 'bitter' as const,
          quantity: { amount: 1, unit: 'dash' as const },
          technique: { technique: 'application' as const, method: 'rinse' as const },
        },
        { type: 'juice' as const, quantity: { amount: 1, unit: 'oz' as const } },
      ];

      const result = sortIngredients(ingredients);

      expect(result[0]).toEqual({
        type: 'bitter',
        quantity: { amount: 1, unit: 'dash' },
        technique: { technique: 'application', method: 'rinse' },
      });
    });

    it('should sort float last', () => {
      const ingredients = [
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'float' },
        },
        { type: 'juice', quantity: { amount: 1, unit: 'oz' } },
      ] as const;

      const result = sortIngredients(ingredients);

      expect(result[result.length - 1]).toEqual({
        type: 'bitter',
        quantity: { amount: 1, unit: 'dash' },
        technique: { technique: 'application', method: 'float' },
      });
    });

    it('should sort top after rinse but before float', () => {
      const result = sortIngredients([
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'float' },
        },
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'top' },
        },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'rinse' },
        },
      ]);

      expect(result).toEqual([
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'rinse' },
        },
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'top' },
        },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'oz' },
          technique: { technique: 'application', method: 'float' },
        },
      ]);
    });

    it('should handle ingredients with multiple techniques', () => {
      const result = sortIngredients([
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: [
            { technique: 'muddled' },
            { technique: 'application', method: 'float' },
          ],
        },
        { type: 'juice', quantity: { amount: 1, unit: 'oz' } },
      ]);

      expect(result[result.length - 1]).toEqual({
        type: 'bitter',
        quantity: { amount: 1, unit: 'dash' },
        technique: [
          { technique: 'muddled' },
          { technique: 'application', method: 'float' },
        ],
      });
    });

    it('should handle ingredients without application technique normally', () => {
      const result = sortIngredients([
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'muddled' },
        },
        { type: 'juice', quantity: { amount: 1, unit: 'oz' } },
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      ]);

      expect(result).toEqual([
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'muddled' },
        },
        { type: 'juice', quantity: { amount: 1, unit: 'oz' } },
        { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      ]);
    });

    it('should handle complete sorting order with all application techniques', () => {
      const result = sortIngredients([
        { type: 'spirit', quantity: { amount: 2, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'bottle' },
          technique: { technique: 'application', method: 'float' },
        },
        { type: 'juice', quantity: { amount: 1, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 2, unit: 'dash' },
          technique: { technique: 'application', method: 'top' },
        },
        { type: 'syrup', quantity: { amount: 0.5, unit: 'oz' } },
        {
          type: 'bitter',
          quantity: { amount: 1, unit: 'dash' },
          technique: { technique: 'application', method: 'rinse' },
        },
      ]);

      const resultMethods = result.map((r) => r.technique?.method || 'none');
      expect(resultMethods).toEqual(['rinse', 'none', 'none', 'none', 'top', 'float']);
    });
  });
});
