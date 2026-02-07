import { describe, expect, it } from 'vitest';
import { roundToFriendlyFraction, roundToFriendlyMl } from './friendly-rounding';

describe('roundToFriendlyFraction', () => {
  describe('oz (quarters + thirds)', () => {
    it.each([
      [1.7, 1.67],
      [2.4, 2.33],
      [1.35, 1.33],
      [3.4, 3.33],
    ])('rounds %f → %f', (input, expected) => {
      expect(roundToFriendlyFraction(input, 'oz')).toBe(expected);
    });

    it('rounds 0.9 up to 1', () => {
      expect(roundToFriendlyFraction(0.9, 'oz')).toBe(1);
    });

    it('rounds 2.1 down to 2', () => {
      expect(roundToFriendlyFraction(2.1, 'oz')).toBe(2);
    });

    it('passes whole numbers through unchanged', () => {
      expect(roundToFriendlyFraction(3, 'oz')).toBe(3);
    });
  });

  describe('tsp/tbsp/cup (quarters only)', () => {
    it.each([
      [1.7, 1.75],
      [2.4, 2.5],
      [1.35, 1.25],
      [3.4, 3.5],
    ])('rounds %f → %f', (input, expected) => {
      expect(roundToFriendlyFraction(input, 'tsp')).toBe(expected);
    });

    it('rounds 0.9 up to 1', () => {
      expect(roundToFriendlyFraction(0.9, 'tbsp')).toBe(1);
    });

    it('rounds 2.1 down to 2', () => {
      expect(roundToFriendlyFraction(2.1, 'cup')).toBe(2);
    });

    it('defaults to oz targets when no unit provided', () => {
      expect(roundToFriendlyFraction(1.7)).toBe(1.67);
    });
  });
});

describe('roundToFriendlyMl', () => {
  it.each([
    [51, 50],
    [72, 70],
    [40.5, 40],
    [102, 100],
  ])('rounds %f → %f for amounts >= 15 ml', (input, expected) => {
    expect(roundToFriendlyMl(input)).toBe(expected);
  });

  it.each([
    [7, 7.5],
    [12.3, 12.5],
    [3, 2.5],
  ])('rounds %f → %f for amounts < 15 ml', (input, expected) => {
    expect(roundToFriendlyMl(input)).toBe(expected);
  });
});
