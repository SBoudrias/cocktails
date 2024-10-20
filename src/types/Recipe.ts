import { RecipeIngredient } from './Ingredient';
import { SourceType } from './Source';
import { Ref } from './Ref';

export type Recipe = {
  name: string;
  slug: string;
  preparation: 'shaken' | 'stirred' | 'blended' | 'flash blended' | 'swizzled';
  served_on: 'big rock' | 'up' | 'crushed ice' | 'blended' | 'ice cubes';
  glassware:
    | 'rocks'
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
    | 'flute';
  ingredients: RecipeIngredient[];
  instructions?: string[];
  source: {
    type: SourceType;
    slug: string;
  };
  refs: Ref[];
};
