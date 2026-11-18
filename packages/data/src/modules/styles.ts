import type { IngredientType } from '../types/Ingredient.ts';
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

const isSpirited = (recipe: Recipe) => hasIngredientOfType(recipe, 'spirit');

/** Citrus or other fruit juice carrying the drink's tartness. */
const isTart = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'juice') || hasIngredientOfType(recipe, 'puree');

const isSweetened = (recipe: Recipe) =>
  hasIngredientOfType(recipe, 'syrup') ||
  hasIngredientOfType(recipe, 'liqueur') ||
  hasIngredientNamed(recipe, /syrup|sugar|honey|cordial/);

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

/** Dairy or coconut body: cream, milk, yogurt, cream of coconut. */
const isCreamy = (recipe: Recipe) =>
  hasIngredientNamed(
    recipe,
    /\bcream\b(?! soda)|condensed milk|\bmilk\b|yogurt|ice cream/,
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
const isDaiquiriFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isTart(recipe) &&
  isSweetened(recipe) &&
  !isAromatized(recipe) &&
  !isCarbonated(recipe) &&
  !hasEggYolk(recipe);

const isSidecarFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  hasIngredientOfType(recipe, 'liqueur') &&
  isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCarbonated(recipe) &&
  !isCreamy(recipe);

const isMartiniFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isAromatized(recipe) &&
  !isTart(recipe) &&
  !hasEggYolk(recipe) &&
  !isCarbonated(recipe) &&
  !isCreamy(recipe);

const isOldFashionedFamily = (recipe: Recipe) =>
  isSpirited(recipe) &&
  isBittered(recipe) &&
  isSweetened(recipe) &&
  !isTart(recipe) &&
  !isAromatized(recipe) &&
  !hasEggYolk(recipe);

const isHighballFamily = (recipe: Recipe) =>
  isSpirited(recipe) && isCarbonated(recipe) && !hasEggYolk(recipe);

const isFlip = (recipe: Recipe) =>
  hasEggYolk(recipe) ||
  (isSpirited(recipe) && isCreamy(recipe) && !isTart(recipe) && !isCarbonated(recipe));

const styleDefinitions: StyleDefinition[] = [
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
