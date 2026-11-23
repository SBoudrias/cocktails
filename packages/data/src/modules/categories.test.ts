import { describe, expect, it } from 'vitest';
import {
  getAllCategories,
  getCategory,
  getChildCategories,
  getRelatedCategories,
  groupCategoriesBySystem,
} from './categories';

describe('getCategory', () => {
  it('falls back to the system node once the loose file is gone', async () => {
    // Aged Jamaican rum only lives in minimalist-tiki.json: the node's
    // description reaches the category, nothing shadows it.
    const category = await getCategory('aged-jamaican-rum');

    expect(category).toMatchObject({
      name: 'Aged Jamaican rum',
      slug: 'aged-jamaican-rum',
      categoryType: 'spirit',
      description: expect.stringContaining('Mai Tai'),
      parents: [],
      type: 'category',
    });
  });
});

describe('getAllCategories', () => {
  it('lists each system node once, with the loose categories', async () => {
    const slugs = (await getAllCategories()).map(({ slug }) => slug);

    expect(slugs).toEqual(expect.arrayContaining(['gin', 'rum', 'aged-jamaican-rum']));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('groupCategoriesBySystem', () => {
  it('puts the house categories first, then systems by first appearance', async () => {
    const groups = await groupCategoriesBySystem(
      await Promise.all(
        ['aged-jamaican-rum', 'blended-aged-rum-jamaica', 'charanda'].map((slug) =>
          getCategory(slug),
        ),
      ),
    );

    expect(
      groups.map(({ system, categories }) => [
        system?.slug ?? 'house',
        categories.map(({ slug }) => slug),
      ]),
    ).toEqual([
      ['house', ['charanda']],
      ['minimalist-tiki', ['aged-jamaican-rum']],
      ['smugglers-cove', ['blended-aged-rum-jamaica']],
    ]);
  });
});

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
    // Armagnac sits under Aged brandy (grapes) inside the non-substituting
    // Brandy (grapes) family: Cognac substitutes (same aged group), Grappa
    // and Pisco don't (unaged group).
    const related = await getRelatedCategories(await getCategory('armagnac'));

    expect(related.map(({ name }) => name)).toEqual(['Aged brandy (grapes)', 'Cognac']);
  });

  it('keeps a system node flavor island non-substituting', async () => {
    // Flavored rum lives only in the Smuggler's Cove system file: its
    // `"substitutable": false` must survive the system-node fallback, so
    // Coconut rum is not offered Spiced or Pineapple rum.
    const related = await getRelatedCategories(await getCategory('coconut-rum'));

    expect(related.map(({ name }) => name)).toEqual(['Flavored rum']);
  });

  it('lists the unaged grape-brandies as siblings, not the aged ones', async () => {
    // Pisco sits under Unaged brandy (grapes): Grappa substitutes (same
    // unaged group), Armagnac and Cognac don't (aged group).
    const related = await getRelatedCategories(await getCategory('pisco'));

    expect(related.map(({ name }) => name)).toEqual(['Grappa', 'Unaged brandy (grapes)']);
  });
});
