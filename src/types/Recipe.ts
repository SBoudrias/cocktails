import { RecipeIngredient } from './Ingredient';
import { SourceType } from './Source';
import { Ref } from './Ref';

export type Recipe = {
  name: string;
  slug: string;
  ingredients: RecipeIngredient[];
  source: {
    type: SourceType;
    slug: string;
  };
  refs: Ref[];
};
