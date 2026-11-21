import { tryConvertVolume } from '@cocktails/conversion';
import { match } from 'ts-pattern';
import type { IngredientType, RecipeIngredient } from '../types/Ingredient.ts';
import type { Recipe } from '../types/Recipe.ts';
import memo from './memo';
import { getAllRecipes } from './recipes';

/**
 * A way of drinking, as a list page: tiki, the Cocktail Codex root
 * families, the classic prep families. Membership is derived at load time
 * from what a recipe already carries — ingredients, preparation,
 * glassware, servings, source — following the non-alcoholic list's
 * pattern: nothing is stored per-recipe, so a style never goes stale as
 * recipes are added.
 */
export type RecipeStyle = {
  slug: string;
  name: string;
  description: string;
};

type StyleDefinition = RecipeStyle & {
  matches: (recipe: Recipe) => boolean;
};

/** Concrete ingredient lines and category lines (a category carries its
 * member type, e.g. 'Vodka' used as a spirit category) all count. */
const isIngredientOfType = (ingredient: RecipeIngredient, type: IngredientType) =>
  ingredient.type === type ||
  (ingredient.type === 'category' && ingredient.categoryType === type);

const hasIngredientOfType = (recipe: Recipe, type: IngredientType) =>
  recipe.ingredients.some((ingredient) => isIngredientOfType(ingredient, type));

const hasIngredientNamed = (recipe: Recipe, pattern: RegExp) =>
  recipe.ingredients.some((ingredient) => pattern.test(ingredient.name.toLowerCase()));

/** Bitters and tinctures poured as seasoning, not as the drink's base. */
const isSmallAlcoholicFlavoringPour = (ingredient: RecipeIngredient) => {
  const ounces = tryConvertVolume(ingredient.quantity, 'oz')?.amount;
  return ounces != null && ounces <= 0.25;
};

function isAlcoholicIngredientType(type: IngredientType | 'category' | undefined) {
  return match(type)
    .with('non-alcoholic', () => false)
    .with('beer', 'liqueur', 'spirit', 'wine', () => true)
    .otherwise(() => false);
}

function isAlcoholicIngredient(ingredient: RecipeIngredient) {
  return match(ingredient)
    .with({ type: 'bitter' }, (bitter) => !isSmallAlcoholicFlavoringPour(bitter))
    .with({ type: 'tincture' }, (tincture) => {
      return !isSmallAlcoholicFlavoringPour(tincture);
    })
    .with({ type: 'category' }, (category) => {
      return match(category.categoryType)
        .with('bitter', 'tincture', () => !isSmallAlcoholicFlavoringPour(category))
        .otherwise((categoryType) => isAlcoholicIngredientType(categoryType));
    })
    .otherwise(({ type }) => isAlcoholicIngredientType(type));
}

/** A recipe whose alcohol, if any, is only seasoning: dashes of bitters. */
export function isNonAlcoholicRecipe(recipe: Recipe) {
  return !recipe.ingredients.some(isAlcoholicIngredient);
}

const isSpirited = (recipe: Recipe) => hasIngredientOfType(recipe, 'spirit');

const techniquesOf = (ingredient: RecipeIngredient) =>
  Array.isArray(ingredient.technique)
    ? ingredient.technique
    : ingredient.technique
      ? [ingredient.technique]
      : [];

/**
 * Lime or lemon fruit whose juice ends up in the drink: cut in wedges or
 * sections, or muddled flesh (a Caipirinha). A peel or zest is aromatics
 * even muddled — a Sazerac's twist or an old-fashioned's muddled peel is
 * not tartness — and so is an unmuddled slice or disc.
 */
const isSqueezedCitrus = (ingredient: RecipeIngredient) => {
  if (!/\b(lime|lemon|yuzu|calamansi)s?\b/.test(ingredient.name.toLowerCase())) {
    return false;
  }

  const techniques = techniquesOf(ingredient);
  const isPeel = techniques.some((technique) =>
    match(technique)
      .with({ technique: 'cut', type: 'peeled' }, () => true)
      .with({ technique: 'cut', type: 'zested' }, () => true)
      .otherwise(() => false),
  );

  return (
    !isPeel &&
    techniques.some((technique) =>
      match(technique)
        .with({ technique: 'muddled' }, () => true)
        .with({ technique: 'cut', type: 'wedged' }, () => true)
        .with({ technique: 'cut', type: 'sectioned' }, () => true)
        .otherwise(() => false),
    )
  );
};

/** Below this pour a citrus cordial seasons a stirred drink (a Bay of
 * Pigs' quarter ounce) rather than souring it (a Gimlet's ounce and more). */
const minTartCordialOunces = 0.5;

const tartJuicePattern = /lime|lemon|verjus|passion ?fruit|yuzu|calamansi|tamarind/;

/**
 * A line that actually carries tartness: citrus juice (lime, lemon, verjus,
 * passion fruit...), a juice whose acidity is known to bite (grapefruit),
 * any juice acid-adjusted on the line, muddled lime or lemon (a
 * Caipirinha's wedges), or a citrus cordial (a Gimlet's lime cordial is
 * its sweetener and its acid at once). Mild fruit juice alone — orange,
 * pineapple — does not make a sour.
 */
const isTartIngredient = (ingredient: RecipeIngredient) => {
  const name = ingredient.name.toLowerCase();
  const kind = match(ingredient)
    .with({ type: 'juice' }, { type: 'puree' }, () => 'juice' as const)
    .with({ type: 'category', categoryType: 'juice' }, () => 'juice' as const)
    .with({ type: 'category', categoryType: 'puree' }, () => 'juice' as const)
    .with({ type: 'fruit' }, () => 'fruit' as const)
    .otherwise(() => 'other' as const);

  if (kind === 'fruit') return isSqueezedCitrus(ingredient);
  if (kind === 'other') {
    return (
      /cordial/.test(name) &&
      /lime|lemon|grapefruit|citrus|sour/.test(name) &&
      ingredientVolumeOz(ingredient) >= minTartCordialOunces
    );
  }

  if (tartJuicePattern.test(name)) return true;

  // Grapefruit and other biting juices carry their acidity on the line.
  if (
    'acidity' in ingredient &&
    ingredient.acidity != null &&
    ingredient.acidity >= 1.5
  ) {
    return true;
  }

  return techniquesOf(ingredient).some(
    ({ technique }) => technique === 'acid-adjustment',
  );
};

const isTart = (recipe: Recipe) => recipe.ingredients.some(isTartIngredient);

/** A sweetener that isn't a liqueur: a syrup line, sugar, honey, a cordial. */
const isPlainSweetener = (ingredient: RecipeIngredient) =>
  isIngredientOfType(ingredient, 'syrup') ||
  /syrup|sugar|honey|cordial/.test(ingredient.name.toLowerCase());

const isSweetened = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'liqueur') || recipe.ingredients.some(isPlainSweetener);

/** Sweetened by something that isn't a liqueur: syrup, sugar, honey. */
const isSweetenedBeyondLiqueur = (recipe: Recipe) =>
  recipe.ingredients.some(isPlainSweetener);

const ingredientVolumeOz = (ingredient: RecipeIngredient) =>
  tryConvertVolume(ingredient.quantity, 'oz')?.amount ?? 0;

const volumeOf = (recipe: Recipe, predicate: (ingredient: RecipeIngredient) => boolean) =>
  recipe.ingredients
    .filter(predicate)
    .reduce((sum, ingredient) => sum + ingredientVolumeOz(ingredient), 0);

/** The liqueurs' total pour: when it outweighs the plain sweetener, the
 * sour belongs to the sidecar family — the liqueur is the sweetener. */
const liqueurVolume = (recipe: Recipe) =>
  volumeOf(recipe, (ingredient) => isIngredientOfType(ingredient, 'liqueur'));

/** The non-liqueur sweetener pour: syrups, sugar, honey. */
const sweetenerVolume = (recipe: Recipe) => volumeOf(recipe, isPlainSweetener);

/** Total juice and puree pour. */
const juiceVolume = (recipe: Recipe) =>
  volumeOf(
    recipe,
    (ingredient) =>
      isIngredientOfType(ingredient, 'juice') || isIngredientOfType(ingredient, 'puree'),
  );

/**
 * The most juice a sour family drink carries: a classic sour runs
 * three-quarters to an ounce and a half of citrus; much past that the
 * drink is a long drink or a punch, not a daiquiri or sidecar.
 */
const maxJuiceOunces = 2.5;

const aromatizedWinePattern =
  /vermouth|sherry|madeira|lillet|quinquina|americano|aperitif|chinato|marsala|pineau|sauternes|punt e mes|byrrh|dubonnet|\bport\b(?!\s+charlotte)|\bporto\b/;

/**
 * Vermouth, sherry, port, madeira and the other fortified aromatized wines,
 * by the bottle's name or its categories: a González Byass Pedro Ximénez
 * names no "sherry", its `Sherry` category does.
 */
const isAromatized = (recipe: Recipe) =>
  recipe.ingredients.some((ingredient) =>
    [
      ingredient.name,
      ...(ingredient.type === 'category'
        ? []
        : ingredient.categories.map(({ name }) => name)),
    ].some((name) => aromatizedWinePattern.test(name.toLowerCase())),
  );

/** Anything fizzy lengthening the drink: soda, beer, sparkling wine. */
const isCarbonated = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'soda') ||
  hasIngredientOfType(recipe, 'beer') ||
  hasIngredientNamed(
    recipe,
    /prosecco|sparkling|champagne|cava|seltzer|ginger beer|ginger ale|tonic(?! syrup)|\bcola\b|coke\b|lager|pilsner|gose|stout|\bcider\b|ipa\b|lambrusco/,
  );

const isBittered = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'bitter') || hasIngredientNamed(recipe, /bitters\b/);

const hasEggYolk = (recipe: Recipe) => hasIngredientNamed(recipe, /whole egg|egg yolk/);

/** Dairy or coconut body: cream, milk, yogurt, cream of coconut, coconut mix. */
const isCreamy = (recipe: Recipe) =>
  hasIngredientNamed(
    recipe,
    /\bcream\b(?! soda)|condensed milk|\bmilk\b|yogurt|ice cream|coconut mix/,
  );

/** Coconut body — cream of coconut, coconut cream, coconut milk, coconut
 * mix: a colada's richness. Reads tropical, not creamy like dairy. */
const isCoconutCreamy = (recipe: Recipe) =>
  hasIngredientNamed(recipe, /cream of coconut|coconut (?:cream|milk|mix)/);

/** Dairy body: cream, milk, yogurt, ice cream — a traditional flip's
 * richness, egg aside. */
const isDairyCreamy = (recipe: Recipe) => isCreamy(recipe) && !isCoconutCreamy(recipe);

/**
 * The ingredients a customer reads as tiki: the classic syrups (orgeat,
 * falernum, fassionola) and flavors (passion fruit, cream of coconut,
 * allspice), plus the tiki houses' own mixes — Donn's and gardenia mixes,
 * zombie mixes — which are tiki markers even when their contents are
 * house secrets. A fruit punch syrup is not one (citrus and sugar — a
 * Hemingway Daiquiri on grapefruit punch syrup reads as a daiquiri), and
 * neither is an orange-rum shrubb, a craft-liqueur pour (a Knickerbocker
 * or a shrubb-vermouth old-fashioned reads as itself, not as tiki).
 */
const tikiMarkerPattern =
  /orgeat|falernum|passion ?fruit|cream of coconut|coconut (?:cream|milk|mix)|allspice|fassionola|donn'?s|gardenia mix|zombie mix/;

/**
 * A tiki drink reads as one: it carries the marker ingredients, or it is
 * served tiki (a tiki glass, or a marker drink on crushed ice). A recipe's
 * source book being tiki does not make the recipe tiki — a plain daiquiri
 * in a tiki book is a plain daiquiri.
 */
const isTiki = (recipe: Recipe) =>
  hasIngredientNamed(recipe, tikiMarkerPattern) || isTikiServe(recipe);

/**
 * A tiki serve — a tiki or hurricane glass, or a marker drink on crushed
 * ice that isn't a frozen blend — files the drink under tiki instead: a
 * Hurricane or a grog is not a daiquiri family member however tart it is.
 * Crushed ice alone is not tiki: a Bramble, a Death & Co Gimlet or a
 * Tommy's Margarita on crushed ice stay sours.
 */
const isTikiServe = (recipe: Recipe) =>
  ['tiki', 'hurricane'].includes(recipe.glassware) ||
  (recipe.served_on === 'crushed ice' &&
    recipe.preparation !== 'blended' &&
    hasIngredientNamed(recipe, tikiMarkerPattern));

/*
 * The six root families of the Cocktail Codex (the chapter structure of
 * Death & Co Welcome Home): every drink is a variation of one of them.
 * The families overlap by design — a shaken sour with a liqueur is both a
 * daiquiri and a sidecar — the way the book's own chapters overlap.
 */

/**
 * The sugar-sour root of the family tree: spirit, citrus and a
 * non-liqueur sweetener — a sour sweetened mainly by a liqueur is a
 * sidecar, not a daiquiri, and the juice pour stays sour-sized
 * (a long drink or a punch carries more). A splash of vermouth or sherry
 * does not take a sour out of the family (a Clover Club), as it doesn't
 * for the sidecar's Corpse Reviver #2.
 */
const isDaiquiriFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isTart(recipe) &&
  isSweetenedBeyondLiqueur(recipe) &&
  liqueurVolume(recipe) <= sweetenerVolume(recipe) &&
  juiceVolume(recipe) <= maxJuiceOunces &&
  !isCarbonated(recipe) &&
  !hasEggYolk(recipe) &&
  !isCreamy(recipe) &&
  !isTikiServe(recipe) &&
  recipe.preparation !== 'flash blended';

/**
 * The liqueur-sour root: spirit, liqueur and citrus — the liqueur can be
 * the whole sweetener, or just balance a sugar-bumped sour. The juice pour
 * stays sour-sized, as with the daiquiri family.
 */
const isSidecarFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  hasIngredientOfType(recipe, 'liqueur') &&
  isTart(recipe) &&
  juiceVolume(recipe) <= maxJuiceOunces &&
  !hasEggYolk(recipe) &&
  !isCarbonated(recipe) &&
  !isCreamy(recipe) &&
  !isTikiServe(recipe) &&
  recipe.preparation !== 'flash blended';

/** Served over a big rock or crushed ice, the old-fashioned way. */
const isServedOnRocks = (recipe: Recipe) =>
  recipe.served_on === 'big rock' ||
  recipe.served_on === 'crushed ice' ||
  ['old fashioned', 'tiki', 'hurricane', 'goblet', 'julep'].includes(recipe.glassware);

/**
 * A rocks-served old-fashioned profile, with or without aromatized wine:
 * Death & Co files vermouth-and-bitters drinks served on a big rock under
 * the old-fashioned, so serving decides between the two families. Bitters
 * are not required when there is no aromatized wine in the glass: the
 * book also files stirred spirit-and-sweetener drinks here (an Artful
 * Dodger is armagnac and banana liqueur, nothing else). A rocks vermouth
 * drink without bitters still belongs to the martini family (a Negroni).
 */
const isOldFashionedFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  (isBittered(recipe) || (recipe.preparation === 'stirred' && !isAromatized(recipe))) &&
  isSweetened(recipe) &&
  !isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCreamy(recipe) &&
  (isServedOnRocks(recipe) || !isAromatized(recipe));

/**
 * Spirit and aromatized wine, stirred: every such drink the old-fashioned
 * family doesn't claim. A rocks-served drink without bitters stays here —
 * a Negroni on a big rock is still a martini family member.
 */
const isMartiniFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isAromatized(recipe) &&
  !isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCreamy(recipe) &&
  !isCarbonated(recipe) &&
  !isOldFashionedFamily(recipe);

const isHighballFamily = (recipe: Recipe) =>
  isSpirited(recipe) && isCarbonated(recipe) && !hasEggYolk(recipe);

/** Egg yolk, or dairy cream in a boozy drink — spirit- or liqueur-based
 * alike (a Grasshopper has no spirit at all). A coconut body is not a
 * flip's richness: it reads tropical, and those drinks belong to tiki
 * (piña coladas and their kin). */
/** Amari and bitter aperitifs as a named pour: campari, aperol, cynar,
 * fernet, and the amari by name. */
const amaroPattern =
  /amaro|amari|fernet|campari|aperol|cynar|braulio|montenegro|nonino|lucano|\bchina\b|amedeo|ciocor|rabarbaro|sfumato/;

/** The amaro or bitter aperitif is a main pour, not seasoning. */
const isAmaroForward = (recipe: Recipe) => {
  if (!hasIngredientNamed(recipe, amaroPattern)) return false;

  const liqueurPour = recipe.ingredients
    .filter((ingredient) => amaroPattern.test(ingredient.name.toLowerCase()))
    .reduce((sum, ingredient) => sum + ingredientVolumeOz(ingredient), 0);

  // Below a seasoning pour (a dash or two of fernet on top of a stirred
  // drink) the amaro does not carry the drink.
  return liqueurPour > 0.5;
};

/** Coffee, espresso or a coffee liqueur carrying the drink. */
const isCoffee = (recipe: Recipe) =>
  hasIngredientNamed(recipe, /espresso|cold brew|\bcoffee\b|caffeine/);

const isFlip = (recipe: Recipe) =>
  hasEggYolk(recipe) ||
  (!isNonAlcoholicRecipe(recipe) && isDairyCreamy(recipe) && !isCarbonated(recipe));

const styleDefinitions: StyleDefinition[] = [
  {
    slug: 'non-alcoholic',
    name: 'Non-Alcoholic',
    description:
      'Alcohol-free drinks — bitters and tinctures allowed as seasoning, not as a base.',
    matches: isNonAlcoholicRecipe,
  },
  {
    slug: 'tiki',
    name: 'Tiki',
    description:
      'Tropical drinks in the tiki tradition — bold rums, exotic syrups, spices and crushed ice.',
    matches: isTiki,
  },
  {
    slug: 'daiquiri-family',
    name: 'Daiquiri family',
    description:
      'Spirit, citrus and sweetener shaken together — the sour family the daiquiri comes from.',
    matches: isDaiquiriFamily,
  },
  {
    slug: 'sidecar-family',
    name: 'Sidecar family',
    description:
      'Spirit, liqueur and citrus — the strong-sweet-tart balance of the sidecar.',
    matches: isSidecarFamily,
  },
  {
    slug: 'martini-family',
    name: 'Martini family',
    description:
      'Spirit lengthened with aromatized wine — the stirred family of the martini, the manhattan and their cousins.',
    matches: isMartiniFamily,
  },
  {
    slug: 'old-fashioned-family',
    name: 'Old-Fashioned family',
    description: 'Spirit, sugar and bitters — the original cocktail formula.',
    matches: isOldFashionedFamily,
  },
  {
    slug: 'highball-family',
    name: 'Highball family',
    description:
      'Spirit stretched with something carbonated, from tall drinks to fizzes and bucks.',
    matches: isHighballFamily,
  },
  {
    slug: 'flip',
    name: 'Flip',
    description: 'Rich drinks built on whole egg or cream.',
    matches: isFlip,
  },
  {
    slug: 'punch',
    name: 'Punch',
    description: 'Mixed by the bowl, for a crowd.',
    matches: (recipe) => (recipe.servings ?? 1) > 1 || recipe.glassware === 'punch',
  },
  {
    slug: 'swizzle',
    name: 'Swizzle',
    description:
      'Spun through crushed ice with a swizzle stick — a tart, rum-forward cooler, not a mint julep.',
    matches: (recipe) =>
      isTart(recipe) &&
      (recipe.preparation === 'swizzled' || /swizzle/i.test(recipe.name)),
  },
  {
    slug: 'julep',
    name: 'Julep',
    description: 'Spirit packed in crushed ice with fresh mint.',
    matches: (recipe) => recipe.glassware === 'julep' || /julep/i.test(recipe.name),
  },
  {
    slug: 'amaro-forward',
    name: 'Amaro-forward',
    description:
      'Amaro or bitter aperitif as a main pour — americano, spritz and amaro-driven drinks.',
    matches: isAmaroForward,
  },
  {
    slug: 'coffee',
    name: 'Coffee',
    description: 'Espresso, cold brew or coffee liqueur carrying the drink.',
    matches: isCoffee,
  },
  {
    slug: 'blended',
    name: 'Blended',
    description: 'Whirred with ice — frozen drinks and flash blends.',
    matches: (recipe) =>
      recipe.preparation === 'blended' || recipe.preparation === 'flash blended',
  },
];

export function getRecipeStyles(): RecipeStyle[] {
  return styleDefinitions.map(({ slug, name, description }) => ({
    slug,
    name,
    description,
  }));
}

export function getRecipeStyle(slug: string): RecipeStyle {
  const definition = styleDefinitions.find((style) => style.slug === slug);

  if (definition == null) throw new Error(`Recipe style not found: ${slug}`);

  return {
    slug: definition.slug,
    name: definition.name,
    description: definition.description,
  };
}

export const getRecipesByStyle = memo(async (slug: string): Promise<Recipe[]> => {
  const definition = styleDefinitions.find((style) => style.slug === slug);

  if (definition == null) throw new Error(`Recipe style not found: ${slug}`);

  const recipes = await getAllRecipes();

  return recipes.filter((recipe) => definition.matches(recipe));
});
