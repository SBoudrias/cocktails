import { Source } from './Source';
import { Ref } from './Ref';
import { BaseIngredient } from './Ingredient';
import { Category } from './Category';

export type Unit = 'oz' | 'ml' | 'dash' | 'tsp' | 'tbsp' | 'drop' | 'unit';

export type Attribution = {
  source: string;
  relation: 'recipe author' | 'adapted by' | 'bar';
  url?: string;
};

export type QuantityDetails = {
  amount: number;
  unit: Unit;
};

export type RecipeIngredient = BaseIngredient | (Category & { type: 'category' });

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
    | 'footer pilsner';
  ingredients: (RecipeIngredient & { quantity: QuantityDetails })[];
  instructions?: string[];
  source: Source;
  attributions: Attribution[];
  refs: Ref[];
};
