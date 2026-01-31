import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '../..');

export const DATA_ROOT = path.join(PACKAGE_ROOT, 'data');
export const INGREDIENT_ROOT = path.join(DATA_ROOT, 'ingredients');
export const CATEGORY_ROOT = path.join(DATA_ROOT, 'categories');
export const RECIPE_ROOT = path.join(DATA_ROOT, 'recipes');
export const BOOK_ROOT = path.join(RECIPE_ROOT, 'book');
export const YOUTUBE_CHANNEL_ROOT = path.join(RECIPE_ROOT, 'youtube-channel');
export const PODCAST_ROOT = path.join(RECIPE_ROOT, 'podcast');
