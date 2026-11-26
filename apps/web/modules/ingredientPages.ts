import type { IngredientPagesFile } from '#/modules/buildIngredientPages';
import { createSharedJson } from '#/modules/sharedJson';

export const { load: loadIngredientPages, getLoaded: getLoadedIngredientPages } =
  createSharedJson<IngredientPagesFile>('data/ingredients.json');
