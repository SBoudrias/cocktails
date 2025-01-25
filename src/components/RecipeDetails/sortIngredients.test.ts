import { describe, it, expect } from 'vitest';
import sortIngredients from './sortIngredients';

describe('sortIngredients', () => {
  it('should sort ingredients by unit priority', () => {
    // Arrange
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

    // Act
    const result = sortIngredients(ingredients);

    // Assert
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
    // Arrange
    const ingredients = [
      { type: 'soda', quantity: { amount: 1, unit: 'unit' } },
      { type: 'liqueur', quantity: { amount: 1, unit: 'unit' } },
      { type: 'juice', quantity: { amount: 1, unit: 'unit' } },
    ] as const;

    // Act
    const result = sortIngredients(ingredients);

    // Assert
    expect(result).toEqual([
      { type: 'juice', quantity: { amount: 1, unit: 'unit' } },
      { type: 'liqueur', quantity: { amount: 1, unit: 'unit' } },
      { type: 'soda', quantity: { amount: 1, unit: 'unit' } },
    ]);
  });

  it('should sort ingredients by quantity', () => {
    // Arrange
    const ingredients = [
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 2, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
    ] as const;

    // Act
    const result = sortIngredients(ingredients);

    // Assert
    expect(result).toEqual([
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 1, unit: 'oz' } },
      { type: 'spirit', quantity: { amount: 2, unit: 'oz' } },
    ]);
  });
});
