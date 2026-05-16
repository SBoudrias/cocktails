import { describe, expect, it } from 'vitest';
import { areSimilarNames, levenshtein } from './name-similarity';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('Death Co', 'Death Co')).toBe(0);
    expect(levenshtein('', '')).toBe(0);
  });

  it('counts single insertion', () => {
    expect(levenshtein('Jared', 'Jarred')).toBe(1);
  });

  it('counts single substitution', () => {
    expect(levenshtein('Mariano Licudine', 'Mariano Licuidine')).toBe(1);
  });

  it('counts two edits for Javel Taft vs Javelle Taft', () => {
    expect(levenshtein('Javel Taft', 'Javelle Taft')).toBe(2);
  });

  it('counts two edits for Death Co vs Deatch Co.', () => {
    expect(levenshtein('Death Co', 'Deatch Co.')).toBe(2);
  });

  it('returns high distance for completely different strings', () => {
    expect(levenshtein('John Smith', 'Jane Doe')).toBeGreaterThan(4);
  });
});

describe('areSimilarNames', () => {
  it('detects all known real-world duplicate pairs', () => {
    expect(areSimilarNames('Jared Weigand', 'Jarred Weigand')).toBe(true);
    expect(areSimilarNames('Javel Taft', 'Javelle Taft')).toBe(true);
    expect(areSimilarNames('Mariano Licudine', 'Mariano Licuidine')).toBe(true);
    expect(areSimilarNames('Death Co', 'Deatch Co.')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(areSimilarNames('jared weigand', 'Jarred Weigand')).toBe(true);
  });

  it('returns false for identical strings', () => {
    expect(areSimilarNames('Jared Weigand', 'Jared Weigand')).toBe(false);
  });

  it('returns false for same string with different casing', () => {
    expect(areSimilarNames('Death Co', 'death co')).toBe(false);
  });

  it('returns false for clearly different names', () => {
    expect(areSimilarNames('John Smith', 'Jane Doe')).toBe(false);
    expect(areSimilarNames('Hemingway', 'Smugglers Cove')).toBe(false);
  });

  it('returns false for very short names (below min length guard)', () => {
    expect(areSimilarNames('Bob', 'Rob')).toBe(false);
    expect(areSimilarNames('Ann', 'Ian')).toBe(false);
  });

  it('returns false when edit distance exceeds threshold', () => {
    expect(areSimilarNames('Giuseppe Gonzalez', 'Abigail Guimaraes')).toBe(false);
  });
});
