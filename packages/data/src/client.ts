// Client-safe exports (no Node.js dependencies)

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

// Conversion
export { convertQuantityToMl, convertQuantityToOz } from './modules/conversion.ts';

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

// Technique
export { formatIngredientName } from './modules/technique.ts';

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
