import path from 'node:path';

export const DATA_ROOT = 'src/data';
export const INGREDIENT_ROOT = path.join(DATA_ROOT, 'ingredients');
export const CATEGORY_ROOT = path.join(DATA_ROOT, 'categories');
export const RECIPE_ROOT = path.join(DATA_ROOT, 'recipes');
export const BOOK_ROOT = path.join(RECIPE_ROOT, 'book');
export const YOUTUBE_CHANNEL_ROOT = path.join(RECIPE_ROOT, 'youtube-channel');
