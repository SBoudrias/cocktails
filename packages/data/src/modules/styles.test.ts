import { describe, expect, it } from 'vitest';
import type { IngredientType, RecipeIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import { getRecipe } from './recipes';
import {
  getRecipeStyle,
  getRecipeStyles,
  getRecipesByStyle,
  isNonAlcoholicRecipe,
} from './styles';

// Real recipes: the derivations walk the ingredient tree the loader enriches
// (categories resolved onto ingredient lines), so fixtures would have to
// mirror that enrichment by hand.
const [
  daiquiri,
  frozenDaiquiri,
  jonsMartini,
  justAnotherJulep,
  grog,
  maiTai,
  littleCoconut,
  hurricane,
  acapulcoGold,
  tequilaSunrise,
  vieuxCarreRocks,
  ninthWonder,
  bermudaTriangle,
  hemingwayDaiquiri,
] = await Promise.all([
  getRecipe(
    { type: 'book', slug: 'tropical-standard' },
    'daiquiri',
    '02_Preparations - Shaken - Up',
  ),
  getRecipe(
    { type: 'book', slug: 'tropical-standard' },
    'frozen-daiquiri',
    '05_Preparations - Frozen',
  ),
  getRecipe(
    { type: 'book', slug: 'death-co-welcome-home' },
    'jons-martini',
    '05_Elegant & Graceful (Martini)',
  ),
  getRecipe({ type: 'book', slug: 'death-and-co' }, 'just-another-julep', '15_Juleps'),
  getRecipe({ type: 'book', slug: 'smugglers-cove' }, 'grog', '06_Rum Through the Ages'),
  getRecipe(
    { type: 'book', slug: 'smugglers-cove' },
    'mai-tai',
    '09_Eight Essential Exotic Elixirs',
  ),
  getRecipe(
    { type: 'book', slug: 'death-co-welcome-home' },
    'little-coconut',
    '05_Rich & Comforting (Flip)',
  ),
  getRecipe({ type: 'book', slug: 'smugglers-cove' }, 'hurricane', '02_The Golden Era'),
  getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'acapulco-gold'),
  getRecipe(
    { type: 'youtube-channel', slug: 'anders-erickson' },
    '1970s-tequila-sunrise',
  ),
  getRecipe(
    { type: 'book', slug: 'death-and-co' },
    'vieux-carre',
    '01_Classic and Vintage',
  ),
  getRecipe({ type: 'youtube-channel', slug: 'educated-barfly' }, '9th-wonder'),
  getRecipe({ type: 'youtube-channel', slug: 'make-and-drink' }, 'bermuda-triangle'),
  getRecipe({ type: 'youtube-channel', slug: 'anders-erickson' }, 'hemingway-daiquiri'),
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
    // A frozen blend is still a daiquiri family member.
    expect(daiquiriFamily.map((recipe) => recipe.name)).toContain(frozenDaiquiri.name);
    expect(martiniFamily.map((recipe) => recipe.name)).toContain(jonsMartini.name);
    expect(julepStyle.map((recipe) => recipe.name)).toContain(justAnotherJulep.name);
    // A marker drink is tiki whatever its source; a plain drink from a
    // tiki book (a grog is rum, lime and demerara) is not.
    expect(tikiStyle.map((recipe) => recipe.name)).toContain(maiTai.name);
    expect(tikiStyle.map((recipe) => recipe.name)).not.toContain(grog.name);
    expect(flipStyle.map((recipe) => recipe.name)).toContain(littleCoconut.name);
  });

  it('keeps serving, tartness and creaminess out of the wrong families', async () => {
    const [daiquiriFamily, sidecarFamily, martiniFamily, oldFashionedFamily, flipStyle] =
      await Promise.all([
        getRecipesByStyle('daiquiri-family'),
        getRecipesByStyle('sidecar-family'),
        getRecipesByStyle('martini-family'),
        getRecipesByStyle('old-fashioned-family'),
        getRecipesByStyle('flip'),
      ]);

    const namesOf = (recipes: typeof daiquiriFamily) =>
      recipes.map((recipe) => `${recipe.name} (${recipe.source.slug})`);

    // A flash-blended drink in a hurricane glass is tiki, not a sour.
    expect(namesOf(daiquiriFamily)).not.toContain(`${hurricane.name} (smugglers-cove)`);
    expect(namesOf(sidecarFamily)).not.toContain(`${hurricane.name} (smugglers-cove)`);
    // Orange juice alone is not tartness.
    expect(namesOf(daiquiriFamily)).not.toContain(
      `${tequilaSunrise.name} (anders-erickson)`,
    );
    // Creamy drinks belong to the flip, not the daiquiri family.
    expect(namesOf(daiquiriFamily)).not.toContain(
      `${acapulcoGold.name} (make-and-drink)`,
    );
    expect(namesOf(flipStyle)).toContain(`${acapulcoGold.name} (make-and-drink)`);

    // Rocks-served vermouth-and-bitters drinks are old-fashioneds.
    expect(namesOf(martiniFamily)).not.toContain(
      `${vieuxCarreRocks.name} (death-and-co)`,
    );
    expect(namesOf(oldFashionedFamily)).toContain(
      `${vieuxCarreRocks.name} (death-and-co)`,
    );

    // A sour sweetened only by a liqueur is a sidecar, not a daiquiri.
    expect(namesOf(daiquiriFamily)).not.toContain(
      `${ninthWonder.name} (educated-barfly)`,
    );
    expect(namesOf(sidecarFamily)).toContain(`${ninthWonder.name} (educated-barfly)`);

    // A sugar-bumped liqueur sour stays a daiquiri when the syrup pour
    // outweighs the liqueur: the Hemingway Daiquiri's maraschino is a
    // seasoning, not the sweetener.
    expect(namesOf(daiquiriFamily)).toContain(
      `${hemingwayDaiquiri.name} (anders-erickson)`,
    );

    // Three ounces of juice is a long drink or a punch, not a sour.
    expect(namesOf(daiquiriFamily)).not.toContain(
      `${bermudaTriangle.name} (make-and-drink)`,
    );
    expect(namesOf(sidecarFamily)).not.toContain(
      `${bermudaTriangle.name} (make-and-drink)`,
    );
  });

  it('reads tartness, serving and wine the way the families mean them', async () => {
    const [daiquiriFamily, sidecarFamily, martiniFamily, oldFashionedFamily, flipStyle] =
      await Promise.all([
        getRecipesByStyle('daiquiri-family'),
        getRecipesByStyle('sidecar-family'),
        getRecipesByStyle('martini-family'),
        getRecipesByStyle('old-fashioned-family'),
        getRecipesByStyle('flip'),
      ]);

    const keysOf = (recipes: Recipe[]) =>
      new Set(recipes.map((recipe) => `${recipe.source.slug}/${recipe.slug}`));
    const daiquiris = keysOf(daiquiriFamily);
    const sidecars = keysOf(sidecarFamily);
    const martinis = keysOf(martiniFamily);
    const oldFashioneds = keysOf(oldFashionedFamily);
    const flips = keysOf(flipStyle);

    // A citrus cordial is the Gimlet's acid as well as its sweetener...
    expect(daiquiris).toContain('make-and-drink/gimlet');
    // ...but a quarter ounce seasoning a stirred rum drink is no sour.
    expect(daiquiris).not.toContain('tropical-standard/bay-of-pigs');
    expect(oldFashioneds).toContain('tropical-standard/bay-of-pigs');

    // Crushed ice alone is not a tiki serve: these stay sours.
    expect(daiquiris).toContain('death-and-co/gimlet');
    expect(daiquiris).toContain('make-and-drink/tommys-margarita');
    // At equal syrup and liqueur pours, a Bramble is in both sour families.
    expect(daiquiris).toContain('anders-erickson/bramble');
    expect(sidecars).toContain('anders-erickson/bramble');

    // Muddled lime wedges are citrus; a lemon twist, even muddled, is not.
    expect(daiquiris).toContain('death-and-co/caipirinha');
    expect(oldFashioneds).toContain('death-and-co/sazerac');
    expect(oldFashioneds).toContain('death-and-co/howlin-at-the-moon');
    expect(sidecars).not.toContain('death-and-co/howlin-at-the-moon');

    // A splash of vermouth does not take a sour out of the daiquiri family.
    expect(daiquiris).toContain('anders-erickson/clover-club');

    // On a big rock but with no bitters, a Negroni stays a martini family
    // member — the old-fashioned family needs its bitters.
    expect(martinis).toContain('anders-erickson/negroni');
    expect(martinis).toContain('death-and-co/negroni');
    expect(oldFashioneds).not.toContain('anders-erickson/negroni');

    // Cream in a liqueur-only drink is still a flip.
    expect(flips).toContain('death-and-co/grasshopper');
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
function mockRecipe(ingredients: RecipeIngredient[]): Recipe {
  return {
    name: 'Test Recipe',
    slug: 'test-recipe',
    preparation: 'shaken',
    served_on: 'up',
    glassware: 'coupe',
    source: {
      type: 'book',
      name: 'Test Source',
      slug: 'test-source',
      link: 'https://example.com',
      description: 'Test description',
      recipeAmount: 1,
    },
    attributions: [],
    refs: [],
    ingredients,
  };
}

function ingredient({
  name,
  type,
  quantity,
}: {
  name: string;
  type: IngredientType;
  quantity: RecipeIngredient['quantity'];
}): RecipeIngredient {
  return {
    name,
    slug: name.toLowerCase().replaceAll(' ', '-'),
    type,
    categories: [],
    refs: [],
    ingredients: [],
    quantity,
  };
}

function categoryIngredient({
  name,
  categoryType,
  quantity,
}: {
  name: string;
  categoryType: IngredientType;
  quantity: RecipeIngredient['quantity'];
}): RecipeIngredient {
  return {
    name,
    slug: name.toLowerCase().replaceAll(' ', '-'),
    type: 'category',
    categoryType,
    parents: [],
    refs: [],
    quantity,
  };
}

describe('isNonAlcoholicRecipe', () => {
  it('allows recipes with only non-alcoholic ingredients', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Ginger beer',
            type: 'soda',
            quantity: { amount: 3, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(true);
  });

  it('allows non-alcoholic spirits and liqueurs as a base', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Wilderton Bittersweet',
            type: 'non-alcoholic',
            quantity: { amount: 2, unit: 'oz' },
          }),
          ingredient({
            name: 'Pineapple juice',
            type: 'juice',
            quantity: { amount: 1.5, unit: 'oz' },
          }),
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 0.5, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(true);
  });

  it('allows bitters and tinctures when used as seasoning', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Angostura bitters',
            type: 'bitter',
            quantity: { amount: 4, unit: 'dash' },
          }),
          categoryIngredient({
            name: 'Orange bitters',
            categoryType: 'bitter',
            quantity: { amount: 3, unit: 'drop' },
          }),
          ingredient({
            name: 'Spicy tincture',
            type: 'tincture',
            quantity: { amount: 2, unit: 'dash' },
          }),
          categoryIngredient({
            name: 'Coffee tincture',
            categoryType: 'tincture',
            quantity: { amount: 2, unit: 'drop' },
          }),
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 1, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(true);
  });

  it('rejects recipes that use bitters as a base', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Angostura bitters',
            type: 'bitter',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Lemon juice',
            type: 'juice',
            quantity: { amount: 0.75, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });

  it('rejects recipes that use tincture as a base', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Hellfire tincture',
            type: 'tincture',
            quantity: { amount: 1, unit: 'oz' },
          }),
          ingredient({
            name: 'Lime juice',
            type: 'juice',
            quantity: { amount: 0.75, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });

  it('rejects recipes with alcoholic ingredients or categories', async () => {
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          ingredient({
            name: 'Gin',
            type: 'spirit',
            quantity: { amount: 2, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
    expect(
      isNonAlcoholicRecipe(
        mockRecipe([
          categoryIngredient({
            name: 'London Dry Gin',
            categoryType: 'spirit',
            quantity: { amount: 2, unit: 'oz' },
          }),
        ]),
      ),
    ).toBe(false);
  });
});
