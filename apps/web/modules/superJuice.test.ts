import { describe, expect, it } from 'vitest';
import { calculateSuperJuice } from './superJuice';

describe('calculateSuperJuice', () => {
  it.each([
    ['lime', 100, { citricAcid: 66, malicAcid: 33, msg: 0, water: 1666 }],
    ['lemon', 100, { citricAcid: 100, malicAcid: 0, msg: 0, water: 1666 }],
    ['orange', 200, { citricAcid: 180, malicAcid: 20, msg: 0, water: 3332 }],
    ['grapefruit', 100, { citricAcid: 80, malicAcid: 20, water: 1666 }],
    ['kumquat', 100, { citricAcid: 25, malicAcid: 0, msg: 0, water: 416.5 }],
  ] as const)(
    'calculates the acid and water additions for %s',
    (citrus, inputWeight, expected) => {
      expect(calculateSuperJuice({ citrus, inputWeight })).toMatchObject(expected);
    },
  );

  it('scales linearly with the input weight', () => {
    expect(calculateSuperJuice({ citrus: 'lime', inputWeight: 50 })).toMatchObject({
      citricAcid: 33,
      malicAcid: 16.5,
      water: 833,
    });
  });

  it('returns NaN additions for an invalid input weight', () => {
    const superJuice = calculateSuperJuice({ citrus: 'lime', inputWeight: -1 });

    expect(superJuice.citricAcid).toBeNaN();
    expect(superJuice.malicAcid).toBeNaN();
    expect(superJuice.water).toBeNaN();
  });
});
