import { describe, expect, it } from 'vitest';
import {
  isApprovedOverlap,
  normalizeName,
  validateApprovedOverlaps,
  type ApprovedOverlaps,
} from './approved-overlaps';

const approved: ApprovedOverlaps = {
  author: ['trey jenkins', 'carey jenkins'],
  bar: ['death & co', 'death co'],
  ingredient: ['coconut milk', 'coconut oil'],
};

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Trey Jenkins  ')).toBe('trey jenkins');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeName('Trey   Jenkins')).toBe('trey jenkins');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeName('Death Co.')).toBe('death co');
    expect(normalizeName('Death Co,')).toBe('death co');
  });

  it('keeps internal punctuation', () => {
    expect(normalizeName('Death & Co')).toBe('death & co');
  });
});

describe('isApprovedOverlap', () => {
  it('suppresses an overlap when both names are approved', () => {
    expect(isApprovedOverlap(approved, 'author', 'Trey Jenkins', 'Carey Jenkins')).toBe(
      true,
    );
  });

  it('is order-independent', () => {
    expect(isApprovedOverlap(approved, 'author', 'Carey Jenkins', 'Trey Jenkins')).toBe(
      true,
    );
  });

  it('is case-insensitive', () => {
    expect(isApprovedOverlap(approved, 'author', 'trey jenkins', 'CAREY JENKINS')).toBe(
      true,
    );
  });

  it('does not suppress when only one name is approved', () => {
    expect(isApprovedOverlap(approved, 'author', 'Trey Jenkins', 'Some Other Name')).toBe(
      false,
    );
  });

  it('does not suppress when neither name is approved', () => {
    expect(isApprovedOverlap(approved, 'author', 'John Smith', 'Jane Doe')).toBe(false);
  });

  it('scopes approvals by kind', () => {
    expect(isApprovedOverlap(approved, 'bar', 'Trey Jenkins', 'Carey Jenkins')).toBe(
      false,
    );
    expect(isApprovedOverlap(approved, 'bar', 'Death & Co', 'Death Co.')).toBe(true);
  });

  it('returns false when the kind has no approvals', () => {
    const emptyBar: ApprovedOverlaps = {
      author: ['trey jenkins', 'carey jenkins'],
      bar: [],
      ingredient: [],
    };
    expect(isApprovedOverlap(emptyBar, 'bar', 'Death & Co', 'Death Co.')).toBe(false);
  });

  it('scopes approvals to the ingredient kind', () => {
    expect(isApprovedOverlap(approved, 'ingredient', 'Coconut milk', 'coconut oil')).toBe(
      true,
    );
    expect(isApprovedOverlap(approved, 'author', 'Coconut milk', 'coconut oil')).toBe(
      false,
    );
  });
});

describe('validateApprovedOverlaps', () => {
  it('accepts a well-formed registry', () => {
    expect(
      validateApprovedOverlaps(
        approved,
        new Map([
          ['trey jenkins', 'Trey Jenkins'],
          ['carey jenkins', 'Carey Jenkins'],
          ['death & co', 'Death & Co'],
          ['death co', 'Death Co'],
          ['coconut milk', 'Coconut milk'],
          ['coconut oil', 'coconut oil'],
        ]),
      ),
    ).toEqual([]);
  });

  it('flags non-normalized names', () => {
    const bad: ApprovedOverlaps = { author: ['Trey Jenkins.'], bar: [], ingredient: [] };
    expect(validateApprovedOverlaps(bad, new Map())).toContain(
      'Approved author name "Trey Jenkins." is not normalized; use "trey jenkins"',
    );
  });

  it('flags duplicate names', () => {
    const bad: ApprovedOverlaps = {
      author: ['trey jenkins', 'Trey Jenkins'],
      bar: [],
      ingredient: [],
    };
    expect(validateApprovedOverlaps(bad, new Map())).toContain(
      'Approved author name "Trey Jenkins" is listed more than once',
    );
  });

  it('flags names that do not match any known name', () => {
    expect(
      validateApprovedOverlaps(approved, new Map([['trey jenkins', 'Trey Jenkins']])),
    ).toContain(
      'Approved author name "carey jenkins" does not match any known author name',
    );
  });
});
