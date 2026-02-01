/**
 * Main entry point - exports only types and pure functions (no node:fs dependencies).
 * Safe to import in both server and client components.
 *
 * For data-loading functions, import from specific subpaths:
 * - @cocktails/data/recipes
 * - @cocktails/data/categories
 * - @cocktails/data/ingredients
 * - @cocktails/data/sources
 * - @cocktails/data/params
 */

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
export type { BookRef, PodcastRef, Ref, WebsiteRef, YoutubeRef } from './types/Ref.ts';
export type { Book, Podcast, Source, YoutubeChannel } from './types/Source.ts';

// Pure functions (no node:fs dependencies)
export { parseChapterFolder, isChapterFolder } from './modules/chapters.ts';
export {
  type SortableIngredient,
  compareIngredients,
} from '@cocktails/ingredient-sorting';
