import { describe, expect, it } from 'vitest';
import { tryConvertVolume } from './conversion';

describe('tryConvertVolume', () => {
  it('converts supported quantities to the requested unit', () => {
    expect(tryConvertVolume({ amount: 2, unit: 'tbsp' }, 'ml')).toEqual({
      amount: 30,
      unit: 'ml',
    });
    expect(tryConvertVolume({ amount: 1, unit: 'cup' }, 'oz')).toEqual({
      amount: 8,
      unit: 'oz',
    });
  });

  it('preserves quantity details while converting a range', () => {
    expect(
      tryConvertVolume(
        {
          amount: 0.5,
          maximum: 0.75,
          modifier: 'scant',
          unit: 'oz',
        },
        'ml',
      ),
    ).toEqual({
      amount: 15,
      maximum: 22.5,
      modifier: 'scant',
      unit: 'ml',
    });
  });

  it('returns undefined for non-volume units', () => {
    expect(tryConvertVolume({ amount: 100, unit: 'gram' }, 'oz')).toBeUndefined();
  });

  it('converts tiny volume units', () => {
    expect(tryConvertVolume({ amount: 4, unit: 'dash' }, 'oz')).toEqual({
      amount: 0.125,
      unit: 'oz',
    });
    expect(tryConvertVolume({ amount: 3, unit: 'drop' }, 'oz')?.amount).toBeCloseTo(
      3 / 576,
    );
    expect(tryConvertVolume({ amount: 2, unit: 'spray' }, 'ml')).toEqual({
      amount: 0.375,
      unit: 'ml',
    });
  });
});
