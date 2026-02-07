import { describe, expect, it } from 'vitest';
import { roundToFriendlyFraction, roundToFriendlyMl } from './friendly-rounding';

describe('roundToFriendlyFraction', () => {
  it.each([
    [1.7, 1.67],
    [2.4, 2.33],
    [1.35, 1.33],
    [3.4, 3.33],
  ])('rounds %f → %f', (input, expected) => {
    expect(roundToFriendlyFraction(input)).toBe(expected);
  });

  it('rounds 0.9 up to 1', () => {
    expect(roundToFriendlyFraction(0.9)).toBe(1);
  });

  it('rounds 2.1 down to 2', () => {
    expect(roundToFriendlyFraction(2.1)).toBe(2);
  });

  it('passes whole numbers through unchanged', () => {
    expect(roundToFriendlyFraction(3)).toBe(3);
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
