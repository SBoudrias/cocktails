// Types
export type { Category } from './types/Category.ts';
export type {
  BaseIngredient,
  IngredientType,
  RecipeIngredient,
  RootIngredient,
  Technique,
} from './types/Ingredient.ts';
export type { Attribution, Recipe } from './types/Recipe.ts';
export type { Ref, YoutubeRef, BookRef, WebsiteRef, PodcastRef } from './types/Ref.ts';
export type { Book, YoutubeChannel, Podcast, Source } from './types/Source.ts';

// Constants
export {
  DATA_ROOT,
  INGREDIENT_ROOT,
  CATEGORY_ROOT,
  RECIPE_ROOT,
  BOOK_ROOT,
  YOUTUBE_CHANNEL_ROOT,
  PODCAST_ROOT,
} from './modules/constants.ts';

// Categories
export {
  getCategory,
  getAllCategories,
  getCategoriesPerParent,
  getChildCategories,
} from './modules/categories.ts';

// Chapters
export { parseChapterFolder, isChapterFolder } from './modules/chapters.ts';

// Conversion
export { convertQuantityToMl, convertQuantityToOz } from './modules/conversion.ts';

// File system utilities
export { fileExists, readJSONFile } from './modules/fs.ts';

// Fuzzy search
export { fuzzySearch } from './modules/fuzzySearch.ts';

// Recipe attribution
export { getRecipeAttribution } from './modules/getRecipeAttribution.ts';

// Data checks
export { categoryHasData, ingredientHasData } from './modules/hasData.ts';

// Ingredient sorting
export {
  type SortableIngredient,
  UNIT_PRIORITIES,
  INGREDIENT_PRIORITIES,
  APPLICATION_PRIORITIES,
  getApplicationTechniquePriority,
  compareIngredients,
} from './modules/ingredientSorting.ts';

// Ingredients
export {
  getIngredient,
  getAllIngredients,
  getIngredientPerCategories,
  getIngredientsForCategory,
  getSubstitutesForIngredient,
  getRecipesForIngredient,
} from './modules/ingredients.ts';

// Params
export {
  getRecipePageParams,
  getIngredientPageParams,
  getSourcePageParams,
} from './modules/params.ts';

// Recipes
export {
  getRecipe,
  getAllRecipes,
  getRecipesPerSource,
  getRecipesFromSource,
  getRecipeByCategory,
} from './modules/recipes.ts';

// Scaling
export {
  scaleQuantity,
  getOptimalUnit,
  calculateScaleFactor,
} from './modules/scaling.ts';

// Search text
export {
  getRecipeSearchText,
  getIngredientOrCategorySearchText,
  getBarSearchText,
  getAuthorSearchText,
} from './modules/searchText.ts';

// Sources
export {
  getBook,
  getYoutubeChannel,
  getPodcast,
  getSource,
  getAllSources,
} from './modules/sources.ts';

// Technique
export { formatIngredientName } from './modules/technique.ts';

// URL helpers
export {
  getRecipeUrl,
  getCategoryUrl,
  getIngredientUrl,
  getSourceUrl,
  getRecipeListUrl,
  getBottleListUrl,
  getIngredientListUrl,
  getAuthorListUrl,
  getBarListUrl,
  getAuthorRecipesUrl,
  getBarRecipesUrl,
} from './modules/url.ts';

// List configs
export type { ListConfig } from './modules/lists/type.ts';
export {
  getNameFirstLetter,
  getNameForSorting,
  compareByName,
  byNameListConfig,
} from './modules/lists/by-name.ts';
export {
  getChapterName,
  compareByPage,
  compareChapterHeaders,
  createChapterHeaderComparator,
  byChapterListConfig,
  createByChapterListConfig,
} from './modules/lists/by-chapter.ts';
