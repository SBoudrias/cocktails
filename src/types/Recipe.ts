import type { RecipeIngredient } from './Ingredient';
import type { Ref } from './Ref';
import type { Source } from './Source';

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
