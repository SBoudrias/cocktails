import { Ingredient } from './Ingredient';

type SourceType = 'book';

export type Recipe = {
  name: string;
  slug: string;
  ingredients: Ingredient[];
  source: {
    type: SourceType;
    slug: string;
  };
};
