import type { RecipeIngredient } from '@cocktails/data';
import { describe, it, expect } from 'vitest';
import { formatIngredientName } from './technique';

// Helper to create a basic ingredient for testing
function createIngredient(overrides: Partial<RecipeIngredient> = {}): RecipeIngredient {
  const baseIngredient = {
    name: 'test ingredient',
    slug: 'test-ingredient',
    type: 'other' as const,
    categories: [],
    refs: [],
    ingredients: [],
    quantity: { amount: 1, unit: 'oz' },
    ...overrides,
  };

  return baseIngredient as RecipeIngredient;
}

describe('formatIngredientName', () => {
  describe('no technique', () => {
    it('should return just the ingredient name when no technique is specified', () => {
      const ingredient = createIngredient({ name: 'lime juice' });
      expect(formatIngredientName(ingredient)).toBe('lime juice');
    });
  });

  describe('infusion technique', () => {
    it('should format infusion with agent', () => {
      const ingredient = createIngredient({
        name: 'vodka',
        technique: { technique: 'infusion', agent: 'vanilla' },
      });
      expect(formatIngredientName(ingredient)).toBe('vanilla–infused vodka');
    });

    it('should format infusion with method and agent', () => {
      const ingredient = createIngredient({
        name: 'rum',
        technique: { technique: 'infusion', agent: 'vanilla', method: 'sous-vide' },
      });
      expect(formatIngredientName(ingredient)).toBe('sous-vide vanilla–infused rum');
    });

    it('should format cold infusion', () => {
      const ingredient = createIngredient({
        name: 'gin',
        technique: { technique: 'infusion', agent: 'cucumber', method: 'cold' },
      });
      expect(formatIngredientName(ingredient)).toBe('cold cucumber–infused gin');
    });

    it('should format hot infusion', () => {
      const ingredient = createIngredient({
        name: 'whiskey',
        technique: { technique: 'infusion', agent: 'tea', method: 'hot' },
      });
      expect(formatIngredientName(ingredient)).toBe('hot tea–infused whiskey');
    });
  });

  describe('fat-wash technique', () => {
    it('should format fat-wash with fat type', () => {
      const ingredient = createIngredient({
        name: 'bourbon',
        technique: { technique: 'fat-wash', fat: 'bacon' },
      });
      expect(formatIngredientName(ingredient)).toBe('bacon–washed bourbon');
    });
  });

  describe('milk-wash technique', () => {
    it('should format milk-wash with milk type', () => {
      const ingredient = createIngredient({
        name: 'rum',
        technique: { technique: 'milk-wash', milk_type: 'oat milk' },
      });
      expect(formatIngredientName(ingredient)).toBe('oat milk milk-washed rum');
    });
  });

  describe('clarification technique', () => {
    it('should format milk clarification with milk type', () => {
      const ingredient = createIngredient({
        name: 'citrus juice',
        technique: {
          technique: 'clarification',
          method: 'milk',
          milk_type: 'whole milk',
        },
      });
      expect(formatIngredientName(ingredient)).toBe(
        'whole milk milk-clarified citrus juice',
      );
    });

    it('should format milk clarification without milk type', () => {
      const ingredient = createIngredient({
        name: 'citrus juice',
        technique: { technique: 'clarification', method: 'milk' },
      });
      expect(formatIngredientName(ingredient)).toBe('milk-clarified citrus juice');
    });

    it('should format general clarification', () => {
      const ingredient = createIngredient({
        name: 'juice',
        technique: { technique: 'clarification' },
      });
      expect(formatIngredientName(ingredient)).toBe('clarified juice');
    });
  });

  describe('temperature technique', () => {
    it('should format chilled ingredients', () => {
      const ingredient = createIngredient({
        name: 'coffee',
        technique: { technique: 'temperature', method: 'chilled' },
      });
      expect(formatIngredientName(ingredient)).toBe('chilled coffee');
    });

    it('should format hot ingredients', () => {
      const ingredient = createIngredient({
        name: 'water',
        technique: { technique: 'temperature', method: 'hot' },
      });
      expect(formatIngredientName(ingredient)).toBe('hot water');
    });

    it('should format frozen ingredients', () => {
      const ingredient = createIngredient({
        name: 'strawberries',
        technique: { technique: 'temperature', method: 'frozen' },
      });
      expect(formatIngredientName(ingredient)).toBe('frozen strawberries');
    });

    it('should format roasted ingredients', () => {
      const ingredient = createIngredient({
        name: 'pear',
        technique: { technique: 'temperature', method: 'roasted' },
      });
      expect(formatIngredientName(ingredient)).toBe('roasted pear');
    });
  });

  describe('muddled technique', () => {
    it('should format muddled ingredients', () => {
      const ingredient = createIngredient({
        name: 'mint leaves',
        technique: { technique: 'muddled' },
      });
      expect(formatIngredientName(ingredient)).toBe('muddled mint leaves');
    });
  });

  describe('cut technique', () => {
    it('should format sliced ingredients (singular)', () => {
      const ingredient = createIngredient({
        name: 'cucumber',
        quantity: { amount: 1, unit: 'unit' },
        technique: { technique: 'cut', type: 'sliced' },
      });
      expect(formatIngredientName(ingredient)).toBe('cucumber slice');
    });

    it('should format sliced ingredients (plural)', () => {
      const ingredient = createIngredient({
        name: 'cucumber',
        quantity: { amount: 3, unit: 'unit' },
        technique: { technique: 'cut', type: 'sliced' },
      });
      expect(formatIngredientName(ingredient)).toBe('cucumber slices');
    });

    it('should format cubed ingredients with size', () => {
      const ingredient = createIngredient({
        name: 'pineapple',
        quantity: { amount: 5, unit: 'unit' },
        technique: { technique: 'cut', type: 'cubed', size: '1-inch' },
      });
      expect(formatIngredientName(ingredient)).toBe('1-inch pineapple cubes');
    });

    it('should format chunked ingredients (singular)', () => {
      const ingredient = createIngredient({
        name: 'apple',
        quantity: { amount: 1, unit: 'unit' },
        technique: { technique: 'cut', type: 'chunked' },
      });
      expect(formatIngredientName(ingredient)).toBe('apple chunk');
    });

    it('should format sectioned ingredients', () => {
      const ingredient = createIngredient({
        name: 'orange',
        quantity: { amount: 2, unit: 'unit' },
        technique: { technique: 'cut', type: 'sectioned' },
      });
      expect(formatIngredientName(ingredient)).toBe('orange sections');
    });

    it('should format diced ingredients', () => {
      const ingredient = createIngredient({
        name: 'onion',
        quantity: { amount: 1, unit: 'unit' },
        technique: { technique: 'cut', type: 'diced' },
      });
      expect(formatIngredientName(ingredient)).toBe('diced onion');
    });

    it('should format julienned ingredients', () => {
      const ingredient = createIngredient({
        name: 'carrots',
        quantity: { amount: 2, unit: 'unit' },
        technique: { technique: 'cut', type: 'julienned' },
      });
      expect(formatIngredientName(ingredient)).toBe('julienned carrots');
    });

    it('should ignore size for non-countable cuts', () => {
      const ingredient = createIngredient({
        name: 'vegetables',
        quantity: { amount: 3, unit: 'unit' },
        technique: { technique: 'cut', type: 'diced', size: '1/4-inch' },
      });
      expect(formatIngredientName(ingredient)).toBe('diced vegetables');
    });

    it('should format wheeled ingredients', () => {
      const ingredient = createIngredient({
        name: 'lemon',
        quantity: { amount: 3, unit: 'unit' },
        technique: { technique: 'cut', type: 'wheeled' },
      });
      expect(formatIngredientName(ingredient)).toBe('lemon wheels');
    });

    it('should format wedged ingredients', () => {
      const ingredient = createIngredient({
        name: 'lime',
        quantity: { amount: 4, unit: 'unit' },
        technique: { technique: 'cut', type: 'wedged' },
      });
      expect(formatIngredientName(ingredient)).toBe('lime wedges');
    });

    it('should format peeled ingredients', () => {
      const ingredient = createIngredient({
        name: 'orange',
        quantity: { amount: 1, unit: 'unit' },
        technique: { technique: 'cut', type: 'peeled' },
      });
      expect(formatIngredientName(ingredient)).toBe('orange peel');
    });

    it('should format zested ingredients', () => {
      const ingredient = createIngredient({
        name: 'lemon',
        quantity: { amount: 1, unit: 'unit' },
        technique: { technique: 'cut', type: 'zested' },
      });
      expect(formatIngredientName(ingredient)).toBe('lemon zest');
    });
  });

  describe('maturity technique', () => {
    it('should format ripe ingredients', () => {
      const ingredient = createIngredient({
        name: 'banana',
        technique: { technique: 'maturity', state: 'ripe' },
      });
      expect(formatIngredientName(ingredient)).toBe('ripe banana');
    });

    it('should format overripe ingredients', () => {
      const ingredient = createIngredient({
        name: 'mango',
        technique: { technique: 'maturity', state: 'overripe' },
      });
      expect(formatIngredientName(ingredient)).toBe('overripe mango');
    });

    it('should format fresh ingredients', () => {
      const ingredient = createIngredient({
        name: 'herbs',
        technique: { technique: 'maturity', state: 'fresh' },
      });
      expect(formatIngredientName(ingredient)).toBe('fresh herbs');
    });

    it('should format aged ingredients', () => {
      const ingredient = createIngredient({
        name: 'cheese',
        technique: { technique: 'maturity', state: 'aged' },
      });
      expect(formatIngredientName(ingredient)).toBe('aged cheese');
    });

    it('should format dried ingredients', () => {
      const ingredient = createIngredient({
        name: 'fruit',
        technique: { technique: 'maturity', state: 'dried' },
      });
      expect(formatIngredientName(ingredient)).toBe('dried fruit');
    });
  });

  describe('application technique', () => {
    it('should format float application', () => {
      const ingredient = createIngredient({
        name: 'rum',
        technique: { technique: 'application', method: 'float' },
      });
      expect(formatIngredientName(ingredient)).toBe('Float of rum');
    });

    it('should format rinse application', () => {
      const ingredient = createIngredient({
        name: 'absinthe',
        technique: { technique: 'application', method: 'rinse' },
      });
      expect(formatIngredientName(ingredient)).toBe('Rinse with absinthe');
    });

    it('should format top application', () => {
      const ingredient = createIngredient({
        name: 'cream',
        technique: { technique: 'application', method: 'top' },
      });
      expect(formatIngredientName(ingredient)).toBe('Top with cream');
    });
  });

  describe('acid-adjustment technique', () => {
    it('should format acid-adjusted ingredients', () => {
      const ingredient = createIngredient({
        name: 'citrus juice',
        technique: { technique: 'acid-adjustment' },
      });
      expect(formatIngredientName(ingredient)).toBe('acid-adjusted citrus juice');
    });
  });

  describe('gelification technique', () => {
    it('should format gelified ingredients', () => {
      const ingredient = createIngredient({
        name: 'amaro',
        technique: { technique: 'gelification', agent: 'agar' },
      });
      expect(formatIngredientName(ingredient)).toBe('gelified amaro');
    });
  });

  describe('multiple techniques', () => {
    it('should format ingredient with multiple techniques applied in sequence', () => {
      const ingredient = createIngredient({
        name: 'pear',
        technique: [
          { technique: 'temperature', method: 'roasted' },
          { technique: 'cut', type: 'sectioned' },
        ],
        quantity: { amount: 2, unit: 'unit' },
      });
      expect(formatIngredientName(ingredient)).toBe('roasted pear sections');
    });

    it('should format ingredient with infusion and cut techniques', () => {
      const ingredient = createIngredient({
        name: 'apple',
        technique: [
          { technique: 'infusion', agent: 'cinnamon', method: 'hot' },
          { technique: 'cut', type: 'diced' },
        ],
      });
      expect(formatIngredientName(ingredient)).toBe('diced hot cinnamon–infused apple');
    });

    it('should handle single technique in array format', () => {
      const ingredient = createIngredient({
        name: 'cucumber',
        technique: [{ technique: 'cut', type: 'sliced' }],
        quantity: { amount: 1, unit: 'unit' },
      });
      expect(formatIngredientName(ingredient)).toBe('cucumber slice');
    });
  });
});
