import { Source } from './Source';
import { Ref } from './Ref';
import { RecipeIngredient } from './Ingredient';

export type Attribution = {
  source: string;
  relation: 'recipe author' | 'adapted by' | 'bar';
  url?: string;
};

export type Recipe = {
  name: string;
  slug: string;
  preparation: 'shaken' | 'stirred' | 'blended' | 'flash blended' | 'swizzled';
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
};
