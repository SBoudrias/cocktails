import { describe, expect, it } from 'vitest';
import { normalizeCategoryCasing } from './category-casing.ts';

describe('normalizeCategoryCasing', () => {
  it('lowercases a trailing generic class word', () => {
    expect(normalizeCategoryCasing('Orange Liqueur')).toBe('Orange liqueur');
    expect(normalizeCategoryCasing('Red Wine')).toBe('Red wine');
    expect(normalizeCategoryCasing('Chocolate Bitters')).toBe('Chocolate bitters');
  });

  it('capitalizes the first character', () => {
    expect(normalizeCategoryCasing('port')).toBe('Port');
    expect(normalizeCategoryCasing('dry sparkling wine')).toBe('Dry sparkling wine');
    expect(normalizeCategoryCasing('thyme liqueur')).toBe('Thyme liqueur');
  });

  it('lowercases common descriptors mid-name', () => {
    expect(normalizeCategoryCasing('Blended Aged Rum (Jamaica)')).toBe(
      'Blended aged rum (Jamaica)',
    );
    expect(normalizeCategoryCasing('Black Walnut Bitters')).toBe('Black walnut bitters');
    expect(normalizeCategoryCasing('Gin (Navy Strength)')).toBe('Gin (navy strength)');
  });

  it('lowercases common nouns inside parentheses', () => {
    expect(normalizeCategoryCasing('Brandy (Apple)')).toBe('Brandy (apple)');
    expect(normalizeCategoryCasing('Brandy (Green Chile)')).toBe('Brandy (green chile)');
    expect(normalizeCategoryCasing('Whiskey (Straight Corn)')).toBe(
      'Whiskey (straight corn)',
    );
  });

  it('keeps proper nouns capitalized', () => {
    expect(normalizeCategoryCasing('Cherry Heering liqueur')).toBe(
      'Cherry Heering liqueur',
    );
    expect(normalizeCategoryCasing('Cane Coffey Still Aged Rum')).toBe(
      'Cane Coffey still aged rum',
    );
    expect(normalizeCategoryCasing('Blended aged rum (Barbados)')).toBe(
      'Blended aged rum (Barbados)',
    );
    expect(normalizeCategoryCasing('Sherry (Amontillado)')).toBe('Sherry (Amontillado)');
    expect(normalizeCategoryCasing('Gin (Plymouth)')).toBe('Gin (Plymouth)');
  });

  it('keeps the crème de X appellation shape', () => {
    expect(normalizeCategoryCasing('Crème de Mûre')).toBe('Crème de Mûre');
    expect(normalizeCategoryCasing('Crème de Cassis')).toBe('Crème de Cassis');
  });

  it('handles hyphenated words', () => {
    expect(normalizeCategoryCasing('Chili pepper-flavored vodka')).toBe(
      'Chili pepper-flavored vodka',
    );
    expect(normalizeCategoryCasing('Blended Lightly-aged Rum')).toBe(
      'Blended lightly-aged rum',
    );
  });

  it('handles accented words', () => {
    expect(normalizeCategoryCasing('Tequila Añejo')).toBe('Tequila añejo');
    expect(normalizeCategoryCasing('Blue Curaçao')).toBe('Blue curaçao');
    expect(normalizeCategoryCasing('Aged Cachaça')).toBe('Aged cachaça');
  });

  it('is idempotent', () => {
    const names = [
      'Peach liqueur',
      'Blended aged rum (Jamaica)',
      'Crème de Mûre',
      'Gin (barrel aged)',
      'Navy strength Jamaican rum',
    ];
    for (const name of names) {
      expect(normalizeCategoryCasing(normalizeCategoryCasing(name))).toBe(name);
    }
  });

  it('leaves names it does not understand untouched', () => {
    expect(normalizeCategoryCasing('Munich Dunkel')).toBe('Munich Dunkel');
    expect(normalizeCategoryCasing('Parfait Amour')).toBe('Parfait Amour');
    expect(normalizeCategoryCasing('Swedish Punsch')).toBe('Swedish Punsch');
  });
});
