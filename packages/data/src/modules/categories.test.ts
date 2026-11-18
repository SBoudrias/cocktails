import { describe, expect, it } from 'vitest';
import { getCategory, getChildCategories, getRelatedCategories } from './categories';

describe('getChildCategories', () => {
  it('returns nested child categories once', async () => {
    const childCategories = await getChildCategories(await getCategory('rum'));
    const slugs = childCategories.map(({ slug }) => slug);

    expect(slugs).toEqual(
      expect.arrayContaining([
        'aged-rum',
        'blended-aged-rum',
        'blended-aged-rum-jamaica',
        'navy-strength-jamaican-rum',
      ]),
    );
    expect(slugs).not.toContain('rum');
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getRelatedCategories', () => {
  it('keeps the parent of a non-substituting family and drops its siblings', async () => {
    // Vodka is a flavor island: chili pepper, chocolate and citrus vodkas
    // each keep their own flavor, so they cannot stand in for one another.
    // Only the plain Vodka parent remains a substitution option.
    const related = await getRelatedCategories(await getCategory('chocolate-vodka'));

    expect(related.map(({ name }) => name)).toEqual(['Vodka']);
  });

  it('lists the aged grape-brandies as siblings, not the unaged ones', async () => {
    // Armagnac sits under Grape brandy (aged) inside the non-substituting
    // Brandy (grapes) family: Cognac substitutes (same aged group), Grappa
    // and Pisco don't (unaged group).
    const related = await getRelatedCategories(await getCategory('armagnac'));

    expect(related.map(({ name }) => name)).toEqual(['Cognac', 'Grape brandy (aged)']);
  });

  it('lists the unaged grape-brandies as siblings, not the aged ones', async () => {
    // Pisco sits under Grape brandy (unaged): Grappa substitutes (same
    // unaged group), Armagnac and Cognac don't (aged group).
    const related = await getRelatedCategories(await getCategory('pisco'));

    expect(related.map(({ name }) => name)).toEqual(['Grape brandy (unaged)', 'Grappa']);
  });
});
