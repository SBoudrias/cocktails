import { Ingredient } from './Ingredient';
import { SourceType } from './Source';

type Ref = {
  type: 'youtube';
  videoId: string;
};

export type Recipe = {
  name: string;
  slug: string;
  ingredients: Ingredient[];
  source: {
    type: SourceType;
    slug: string;
  };
  refs: Ref[];
};
