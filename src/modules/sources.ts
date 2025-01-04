import fs from 'node:fs/promises';
import { Book, Source, YoutubeChannel } from '@/types/Source';
import path from 'node:path';
import memo from 'lodash/memoize';
import { readJSONFile } from './fs';
import { BOOK_ROOT, RECIPE_ROOT, YOUTUBE_CHANNEL_ROOT } from './constants';

function getRecipeSourcePath(root: string, slug: string): string {
  return path.join(root, slug, '_source.json');
}

export const getBook = memo(async (book: string): Promise<Book> => {
  const filepath = getRecipeSourcePath(BOOK_ROOT, book);
  const data = await readJSONFile<Omit<Book, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Book not found: ${filepath}`);

  return {
    ...data,
    type: 'book',
    slug: book,
  };
});

export const getYoutubeChannel = memo(async (slug: string): Promise<YoutubeChannel> => {
  const filepath = getRecipeSourcePath(YOUTUBE_CHANNEL_ROOT, slug);
  const data = await readJSONFile<Omit<YoutubeChannel, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Youtube channel not found: ${filepath}`);

  return {
    ...data,
    type: 'youtube-channel',
    slug: slug,
  };
});

export const getSource = async (type: string, slug: string): Promise<Source> => {
  if (type === 'book') {
    return getBook(slug);
  } else {
    return getYoutubeChannel(slug);
  }
};

export const getAllSources = memo(async () => {
  const sources: Promise<Source>[] = [];

  for await (const sourceType of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, sourceType))) {
      sources.push(getSource(sourceType, sourceSlug));
    }
  }

  return await Promise.all(sources);
});
