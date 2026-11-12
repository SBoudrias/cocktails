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
    'calculates the published acid and water additions for %s',
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

  it('includes the pressed juice in the approximate yield of peeled citrus', () => {
    expect(
      calculateSuperJuice({ citrus: 'lime', inputWeight: 100, juiceWeight: 200 }),
    ).toMatchObject({ approximateYield: 66 + 33 + 1666 + 200 });
  });

  it('includes the whole fruit in the kumquat approximate yield', () => {
    expect(calculateSuperJuice({ citrus: 'kumquat', inputWeight: 100 })).toMatchObject({
      approximateYield: 25 + 416.5 + 100,
    });
  });

  it('omits the yield while the juice weight is unknown for peeled citrus', () => {
    expect(
      calculateSuperJuice({ citrus: 'lemon', inputWeight: 100 }).approximateYield,
    ).toBeUndefined();
  });

  it('treats an empty juice weight as zero in the approximate yield', () => {
    expect(
      calculateSuperJuice({ citrus: 'lemon', inputWeight: 100, juiceWeight: 0 }),
    ).toMatchObject({ approximateYield: 100 + 1666 });
  });

  it('returns NaN additions for an invalid input weight', () => {
    const superJuice = calculateSuperJuice({ citrus: 'lime', inputWeight: -1 });

    expect(superJuice.citricAcid).toBeNaN();
    expect(superJuice.malicAcid).toBeNaN();
    expect(superJuice.water).toBeNaN();
    expect(superJuice.approximateYield).toBeUndefined();
  });
});
