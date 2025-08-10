import { describe, it, expect } from 'vitest';
import { scaleQuantity, getOptimalUnit, calculateScaleFactor } from './scaling';

describe('scaling module', () => {
  describe('calculateScaleFactor', () => {
    it('should calculate correct scale factor for normal values', () => {
      expect(calculateScaleFactor(1, 2)).toBe(2);
      expect(calculateScaleFactor(2, 1)).toBe(0.5);
      expect(calculateScaleFactor(4, 8)).toBe(2);
    });

    it('should return 1 for invalid inputs', () => {
      expect(calculateScaleFactor(0, 2)).toBe(1);
      expect(calculateScaleFactor(2, 0)).toBe(1);
      expect(calculateScaleFactor(-1, 2)).toBe(1);
    });
  });

  describe('scaleQuantity', () => {
    it('should scale quantities correctly', () => {
      const quantity = { amount: 2, unit: 'oz' };
      const result = scaleQuantity(quantity, 2);

      expect(result.amount).toBe(4);
      expect(result.unit).toBe('oz');
      expect(result.originalAmount).toBe(2);
      expect(result.originalUnit).toBe('oz');
    });

    it('should scale and optimize units', () => {
      const quantity = { amount: 1, unit: 'tbsp' };
      const result = scaleQuantity(quantity, 2);

      expect(result.amount).toBe(1);
      expect(result.unit).toBe('oz');
      expect(result.originalAmount).toBe(1);
      expect(result.originalUnit).toBe('tbsp');
    });

    it('should handle fractional scaling', () => {
      const quantity = { amount: 4, unit: 'oz' };
      const result = scaleQuantity(quantity, 0.5);

      expect(result.amount).toBe(2);
      expect(result.unit).toBe('oz');
    });
  });

  describe('getOptimalUnit', () => {
    it('should convert 2 tbsp to 1 oz', () => {
      const result = getOptimalUnit(2, 'tbsp');
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('oz');
    });

    it('should convert 3 tsp to 1 tbsp', () => {
      const result = getOptimalUnit(3, 'tsp');
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('tbsp');
    });

    it('should convert 6 tsp to 1 oz (recursive conversion)', () => {
      const result = getOptimalUnit(6, 'tsp');
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('oz');
    });

    it('should convert 16 oz to 1 cup', () => {
      const result = getOptimalUnit(16, 'oz');
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('cup');
    });

    it('should not convert amounts below threshold', () => {
      const result = getOptimalUnit(1, 'tbsp');
      expect(result.amount).toBe(1);
      expect(result.unit).toBe('tbsp');
    });

    it('should not convert very small amounts', () => {
      const result = getOptimalUnit(0.05, 'oz');
      expect(result.amount).toBe(0.05);
      expect(result.unit).toBe('oz');
    });

    it('should not convert non-optimizable units', () => {
      const result = getOptimalUnit(10, 'dash');
      expect(result.amount).toBe(10);
      expect(result.unit).toBe('dash');
    });

    it('should round to reasonable precision', () => {
      const result = getOptimalUnit(2.666666, 'oz');
      expect(result.amount).toBe(2.67);
      expect(result.unit).toBe('oz');
    });

    it('should handle ml units without conversion', () => {
      const result = getOptimalUnit(100, 'ml');
      expect(result.amount).toBe(100);
      expect(result.unit).toBe('ml');
    });
  });

  describe('edge cases', () => {
    it('should handle zero amounts', () => {
      const quantity = { amount: 0, unit: 'oz' };
      const result = scaleQuantity(quantity, 5);

      expect(result.amount).toBe(0);
      expect(result.unit).toBe('oz');
    });

    it('should handle large scale factors', () => {
      const quantity = { amount: 1, unit: 'tsp' };
      const result = scaleQuantity(quantity, 50);

      // 50 tsp = 16.67 tbsp = 8.33 oz (doesn't reach 16 oz threshold for cup conversion)
      expect(result.amount).toBe(8.34);
      expect(result.unit).toBe('oz');
    });

    it('should handle units that cannot be optimized', () => {
      const quantity = { amount: 5, unit: 'dash' };
      const result = scaleQuantity(quantity, 3);

      expect(result.amount).toBe(15);
      expect(result.unit).toBe('dash');
    });
  });
});
