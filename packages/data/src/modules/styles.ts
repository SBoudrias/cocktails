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

const hasIngredientOfType = (recipe: Recipe, type: IngredientType) =>
  recipe.ingredients.some(
    (ingredient) =>
      ingredient.type === type ||
      (ingredient.type === 'category' && ingredient.categoryType === type),
  );

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
    .when(
      ({ type }) => isAlcoholicIngredientType(type),
      () => true,
    )
    .with({ type: 'bitter' }, (bitter) => !isSmallAlcoholicFlavoringPour(bitter))
    .with({ type: 'tincture' }, (tincture) => {
      return !isSmallAlcoholicFlavoringPour(tincture);
    })
    .with({ type: 'category' }, (category) => {
      return match(category.categoryType)
        .with('bitter', 'tincture', () => !isSmallAlcoholicFlavoringPour(category))
        .when(isAlcoholicIngredientType, () => true)
        .otherwise(() => false);
    })
    .otherwise(() => false);
}

/** A recipe whose alcohol, if any, is only seasoning: dashes of bitters. */
export function isNonAlcoholicRecipe(recipe: Recipe) {
  return !recipe.ingredients.some(isAlcoholicIngredient);
}

const isSpirited = (recipe: Recipe) => hasIngredientOfType(recipe, 'spirit');

/**
 * A juice or puree that actually carries tartness: citrus (lime, lemon,
 * verjus, passion fruit...), a juice whose acidity is known to bite
 * (grapefruit), or any juice acid-adjusted on the line. Mild fruit juice
 * alone — orange, pineapple — does not make a sour.
 */
const isTartIngredient = (ingredient: RecipeIngredient) => {
  const isJuice = match(ingredient)
    .with({ type: 'juice' }, () => true)
    .with({ type: 'puree' }, () => true)
    .with({ type: 'category', categoryType: 'juice' }, () => true)
    .with({ type: 'category', categoryType: 'puree' }, () => true)
    .otherwise(() => false);

  if (!isJuice) return false;

  if (
    /lime|lemon|verjus|passion fruit|yuzu|calamansi|tamarind/.test(
      ingredient.name.toLowerCase(),
    )
  ) {
    return true;
  }

  // Grapefruit and other biting juices carry their acidity on the line.
  if (
    'acidity' in ingredient &&
    ingredient.acidity != null &&
    ingredient.acidity >= 1.5
  ) {
    return true;
  }

  const techniques = Array.isArray(ingredient.technique)
    ? ingredient.technique
    : ingredient.technique
      ? [ingredient.technique]
      : [];

  return techniques.some(({ technique }) => technique === 'acid-adjustment');
};

const isTart = (recipe: Recipe) => recipe.ingredients.some(isTartIngredient);

const isSweetened = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'syrup') ||
  hasIngredientOfType(recipe, 'liqueur') ||
  hasIngredientNamed(recipe, /syrup|sugar|honey|cordial/);

/** Sweetened by something that isn't a liqueur: syrup, sugar, honey. */
const isSweetenedBeyondLiqueur = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'syrup') ||
  hasIngredientNamed(recipe, /syrup|sugar|honey|cordial/);

const ingredientVolumeOz = (ingredient: RecipeIngredient) =>
  tryConvertVolume(ingredient.quantity, 'oz')?.amount ?? 0;

/** Concrete ingredient lines and category lines (a category carries its
 * member type, e.g. 'Vodka' used as a spirit category) all count. */
const isIngredientOfType = (ingredient: RecipeIngredient, type: IngredientType) =>
  ingredient.type === type ||
  (ingredient.type === 'category' && ingredient.categoryType === type);

const volumeOf = (recipe: Recipe, predicate: (ingredient: RecipeIngredient) => boolean) =>
  recipe.ingredients
    .filter(predicate)
    .reduce((sum, ingredient) => sum + ingredientVolumeOz(ingredient), 0);

/** The liqueurs' total pour: when it outweighs the plain sweetener, the
 * sour belongs to the sidecar family — the liqueur is the sweetener. */
const liqueurVolume = (recipe: Recipe) =>
  volumeOf(recipe, (ingredient) => isIngredientOfType(ingredient, 'liqueur'));

/** The non-liqueur sweetener pour: syrups, sugar, honey. */
const sweetenerVolume = (recipe: Recipe) =>
  volumeOf(
    recipe,
    (ingredient) =>
      isIngredientOfType(ingredient, 'syrup') ||
      /syrup|sugar|honey|cordial/.test(ingredient.name.toLowerCase()),
  );

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

/** Vermouth, sherry, port, madeira and the other fortified aromatized wines. */
const isAromatized = (recipe: Recipe) =>
  hasIngredientNamed(
    recipe,
    /vermouth|sherry|madeira|lillet|quinquina|americano|aperitif|chinato|marsala|pineau|sauternes|\bport\b(?!\s+charlotte)|\bporto\b/,
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

/**
 * The books and channels whose whole catalog is tiki: every recipe they
 * published counts, whatever its ingredients.
 */
const tikiSourceSlugs = new Set([
  'smugglers-cove',
  'minimalist-tiki',
  'easy-tiki',
  'sippin-safari',
  'tropical-standard',
  'tiki-modern-tropical-cocktails',
  'coconuts-and-carnage',
  'mixing-up-tiki',
]);

/**
 * The six root families of the Cocktail Codex (the chapter structure of
 * Death & Co Welcome Home): every drink is a variation of one of them.
 * The families overlap by design — a shaken sour with a liqueur is both a
 * daiquiri and a sidecar — the way the book's own chapters overlap.
 */
/**
 * A tiki serve — a tiki glass, or crushed ice that isn't a frozen blend —
 * files the drink under tiki instead: a Hurricane or a grog is not a
 * daiquiri family member however tart it is.
 */
const isTikiServe = (recipe: Recipe) =>
  ['tiki', 'hurricane', 'goblet'].includes(recipe.glassware) ||
  (recipe.served_on === 'crushed ice' && recipe.preparation !== 'blended');

/**
 * The sugar-sour root of the family tree: spirit, citrus and a
 * non-liqueur sweetener — a sour sweetened mainly by a liqueur is a
 * sidecar, not a daiquiri, and the juice pour stays sour-sized
 * (a long drink or a punch carries more).
 */
const isDaiquiriFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isTart(recipe) &&
  isSweetenedBeyondLiqueur(recipe) &&
  liqueurVolume(recipe) <= sweetenerVolume(recipe) &&
  juiceVolume(recipe) <= maxJuiceOunces &&
  !isAromatized(recipe) &&
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

/**
 * A rocks-served old-fashioned profile, with or without aromatized wine:
 * Death & Co files vermouth-and-bitters drinks served on a big rock under
 * the old-fashioned, so serving decides between the two families.
 */
const isOldFashionedFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isBittered(recipe) &&
  isSweetened(recipe) &&
  !isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCreamy(recipe) &&
  (isServedOnRocks(recipe) || !isAromatized(recipe));

/** Served over a big rock or crushed ice, the old-fashioned way. */
const isServedOnRocks = (recipe: Recipe) =>
  recipe.served_on === 'big rock' ||
  recipe.served_on === 'crushed ice' ||
  ['old fashioned', 'tiki', 'hurricane', 'goblet', 'julep'].includes(recipe.glassware);

const isMartiniFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isAromatized(recipe) &&
  !isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCreamy(recipe) &&
  !isCarbonated(recipe) &&
  !isServedOnRocks(recipe);

const isHighballFamily = (recipe: Recipe) =>
  isSpirited(recipe) && isCarbonated(recipe) && !hasEggYolk(recipe);

const isFlip = (recipe: Recipe) =>
  hasEggYolk(recipe) || (isSpirited(recipe) && isCreamy(recipe) && !isCarbonated(recipe));

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
    matches: (recipe) =>
      tikiSourceSlugs.has(recipe.source.slug) ||
      hasIngredientNamed(
        recipe,
        /orgeat|falernum|passion fruit|cream of coconut|allspice|fassionola/,
      ),
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
    description: 'Built in the glass and spun through crushed ice with a swizzle stick.',
    matches: (recipe) =>
      recipe.preparation === 'swizzled' || /swizzle/i.test(recipe.name),
  },
  {
    slug: 'julep',
    name: 'Julep',
    description: 'Spirit packed in crushed ice with fresh mint.',
    matches: (recipe) => recipe.glassware === 'julep' || /julep/i.test(recipe.name),
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
