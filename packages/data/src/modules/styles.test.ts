import { describe, expect, it } from 'vitest';
import { getRecipe } from './recipes';
import { getRecipeStyle, getRecipeStyles, getRecipesByStyle } from './styles';

// Real recipes: the derivations walk the ingredient tree the loader enriches
// (categories resolved onto ingredient lines), so fixtures would have to
// mirror that enrichment by hand.
const [daiquiri, jonsMartini, justAnotherJulep, grog, littleCoconut] = await Promise.all([
  getRecipe(
    { type: 'book', slug: 'tropical-standard' },
    'daiquiri',
    '02_Preparations - Shaken - Up',
  ),
  getRecipe(
    { type: 'book', slug: 'death-co-welcome-home' },
    'jons-martini',
    '05_Elegant & Graceful (Martini)',
  ),
  getRecipe({ type: 'book', slug: 'death-and-co' }, 'just-another-julep', '15_Juleps'),
  getRecipe({ type: 'book', slug: 'smugglers-cove' }, 'grog', '06_Rum Through the Ages'),
  getRecipe(
    { type: 'book', slug: 'death-co-welcome-home' },
    'little-coconut',
    '05_Rich & Comforting (Flip)',
  ),
]);

describe('getRecipeStyles', () => {
  it('lists every style with a slug, name and description', () => {
    const styles = getRecipeStyles();

    for (const { name, description } of styles) {
      expect(name).not.toHaveLength(0);
      expect(description).not.toHaveLength(0);
    }
  });
});

describe('getRecipeStyle', () => {
  it('resolves a style by slug', () => {
    expect(getRecipeStyle('tiki').name).toBe('Tiki');
  });

  it('throws on an unknown slug', () => {
    expect(() => getRecipeStyle('spritz')).toThrow('Recipe style not found');
  });
});

describe('getRecipesByStyle', () => {
  it('derives each family from the real corpus', async () => {
    const [daiquiriFamily, martiniFamily, julepStyle, tikiStyle, flipStyle] =
      await Promise.all([
        getRecipesByStyle('daiquiri-family'),
        getRecipesByStyle('martini-family'),
        getRecipesByStyle('julep'),
        getRecipesByStyle('tiki'),
        getRecipesByStyle('flip'),
      ]);

    expect(daiquiriFamily.map((recipe) => recipe.name)).toContain(daiquiri.name);
    expect(martiniFamily.map((recipe) => recipe.name)).toContain(jonsMartini.name);
    expect(julepStyle.map((recipe) => recipe.name)).toContain(justAnotherJulep.name);
    // Whole-catalog tiki books make every recipe they published tiki.
    expect(tikiStyle.map((recipe) => recipe.name)).toContain(grog.name);
    expect(flipStyle.map((recipe) => recipe.name)).toContain(littleCoconut.name);
  });

  it('returns only matching recipes, alphabetically sorted', async () => {
    const punch = await getRecipesByStyle('punch');

    for (const recipe of punch) {
      expect((recipe.servings ?? 1) > 1 || recipe.glassware === 'punch').toBe(true);
    }

    const names = punch.map((recipe) => recipe.name);
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b)));
  });

  it('throws on an unknown slug', async () => {
    await expect(getRecipesByStyle('sour')).rejects.toThrow('Recipe style not found');
  });
});
