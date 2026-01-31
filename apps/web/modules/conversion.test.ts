import { describe, it, expect } from 'vitest';
import { convertQuantityToMl, convertQuantityToOz } from './conversion';

describe('conversion module', () => {
  describe('convertQuantityToMl', () => {
    it('should convert tsp to ml', () => {
      const result = convertQuantityToMl({ amount: 1, unit: 'tsp' });
      expect(result.amount).toBe(5);
      expect(result.unit).toBe('ml');
    });

    it('should convert tbsp to ml', () => {
      const result = convertQuantityToMl({ amount: 1, unit: 'tbsp' });
      expect(result.amount).toBe(15);
      expect(result.unit).toBe('ml');
    });

    it('should convert oz to ml', () => {
      const result = convertQuantityToMl({ amount: 1, unit: 'oz' });
      expect(result.amount).toBe(30);
      expect(result.unit).toBe('ml');
    });

    it('should convert cup to ml', () => {
      const result = convertQuantityToMl({ amount: 1, unit: 'cup' });
      expect(result.amount).toBe(240);
      expect(result.unit).toBe('ml');
    });

    it('should pass through non-convertible units unchanged', () => {
      const result = convertQuantityToMl({ amount: 3, unit: 'dash' });
      expect(result.amount).toBe(3);
      expect(result.unit).toBe('dash');
    });

    it('should pass through ml units unchanged', () => {
      const result = convertQuantityToMl({ amount: 60, unit: 'ml' });
      expect(result.amount).toBe(60);
      expect(result.unit).toBe('ml');
    });

    it('should handle fractional amounts', () => {
      const result = convertQuantityToMl({ amount: 0.5, unit: 'oz' });
      expect(result.amount).toBe(15);
      expect(result.unit).toBe('ml');
    });
  });

  describe('convertQuantityToOz', () => {
    it('should convert ml to oz', () => {
      const result = convertQuantityToOz({ amount: 30, unit: 'ml' });
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('oz');
    });

    it('should convert 60ml to 2oz', () => {
      const result = convertQuantityToOz({ amount: 60, unit: 'ml' });
      expect(result.amount).toBe(2);
      expect(result.unit).toBe('oz');
    });

    it('should handle fractional ml amounts', () => {
      const result = convertQuantityToOz({ amount: 15, unit: 'ml' });
      expect(result.amount).toBe(0.5);
      expect(result.unit).toBe('oz');
    });

    it('should pass through oz units unchanged', () => {
      const result = convertQuantityToOz({ amount: 2, unit: 'oz' });
      expect(result.amount).toBe(2);
      expect(result.unit).toBe('oz');
    });

    it('should pass through non-ml units unchanged', () => {
      const result = convertQuantityToOz({ amount: 3, unit: 'dash' });
      expect(result.amount).toBe(3);
      expect(result.unit).toBe('dash');
    });

    it('should pass through tsp units unchanged', () => {
      const result = convertQuantityToOz({ amount: 1, unit: 'tsp' });
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('tsp');
    });

    it('should handle zero amounts', () => {
      const result = convertQuantityToOz({ amount: 0, unit: 'ml' });
      expect(result.amount).toBe(0);
      expect(result.unit).toBe('oz');
    });
  });
});
