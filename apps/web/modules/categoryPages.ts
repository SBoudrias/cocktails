import type { CategoryPagesFile } from '#/modules/buildCategoryPages';
import { createSharedJson } from '#/modules/sharedJson';

export const { load: loadCategoryPages, getLoaded: getLoadedCategoryPages } =
  createSharedJson<CategoryPagesFile>('data/categories.json');
