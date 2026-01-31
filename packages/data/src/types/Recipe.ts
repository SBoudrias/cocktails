import type { RecipeIngredient } from './Ingredient.ts';
import type { Ref } from './Ref.ts';
import type { Source } from './Source.ts';

type BarAttribution = {
  relation: 'bar';
  source: string;
  location?: string;
  url?: string;
};

type BookAttribution = {
  relation: 'book';
  source: string;
  page?: number;
  url?: string;
};

export type Attribution =
  | BarAttribution
  | BookAttribution
  | {
      relation: 'recipe author' | 'adapted by';
      source: string;
      url?: string;
    };

export type Recipe = {
  name: string;
  slug: string;
  chapter?: string; // Derived from filesystem folder name (e.g., "01_Rum Drinks")
  preparation: 'built' | 'shaken' | 'stirred' | 'blended' | 'flash blended' | 'swizzled';
  served_on: 'big rock' | 'up' | 'crushed ice' | 'blended' | 'ice cubes';
  glassware:
    | 'old fashioned'
    | 'collins'
    | 'highball'
    | 'snifter'
    | 'coupe'
    | 'martini'
    | 'nick & nora'
    | 'irish'
    | 'hurricane'
    | 'julep'
    | 'mule'
    | 'tiki'
    | 'punch'
    | 'flute'
    | 'footer pilsner'
    | 'goblet';
  ingredients: RecipeIngredient[];
  instructions?: string[];
  source: Source;
  attributions: Attribution[];
  refs: Ref[];
  servings?: number;
};
