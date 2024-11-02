import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import path from 'node:path';
import { BOOK_ROOT, YOUTUBE_CHANNEL_ROOT } from './constants';
import { getRecipe } from './recipes';
import { getBook, getYoutubeChannel } from './sources';

export async function getAllData(): Promise<{
  sources: Source[];
  recipes: Recipe[];
}> {
  const sources: Source[] = [];
  const recipes: Recipe[] = [];

  for await (const slug of await fs.readdir(BOOK_ROOT)) {
    const book = await getBook(slug);
    sources.push(book);

    for await (const recipeSlug of await fs.readdir(path.join(BOOK_ROOT, slug))) {
      if (recipeSlug === '_source.json') continue;

      const recipe = await getRecipe(
        { type: 'book', slug },
        path.basename(recipeSlug, '.json'),
      );
      if (!recipe) continue;
      recipes.push(recipe);
    }
  }

  for await (const slug of await fs.readdir(YOUTUBE_CHANNEL_ROOT)) {
    const channel = await getYoutubeChannel(slug);
    sources.push(channel);

    for await (const recipeSlug of await fs.readdir(
      path.join(YOUTUBE_CHANNEL_ROOT, slug),
    )) {
      if (recipeSlug === '_source.json') continue;

      const recipe = await getRecipe(
        { type: 'youtube-channel', slug },
        path.basename(recipeSlug, '.json'),
      );
      if (!recipe) continue;
      recipes.push(recipe);
    }
  }

  return { sources, recipes };
}
