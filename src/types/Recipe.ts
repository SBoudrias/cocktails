import { Ingredient } from './Ingredient';
import { SourceType } from './Source';

export type Recipe = {
  name: string;
  slug: string;
  ingredients: Ingredient[];
  source: {
    type: SourceType;
    slug: string;
  };
};
