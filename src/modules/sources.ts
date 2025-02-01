import fs from 'node:fs/promises';
import { Book, Source, YoutubeChannel } from '@/types/Source';
import path from 'node:path';
import memo from 'lodash/memoize';
import { readJSONFile } from './fs';
import { BOOK_ROOT, RECIPE_ROOT, YOUTUBE_CHANNEL_ROOT } from './constants';
import { match } from 'ts-pattern';

function getRecipeSourcePath(root: string, slug: string): string {
  return path.join(root, slug, '_source.json');
}

function getRecipeAmount(root: string, slug: string): Promise<number> {
  const folderPath = path.join(root, slug);
  // length - 1 because of the _source.json file
  return fs.readdir(folderPath).then((files) => files.length - 1);
}

export const getBook = memo(async (book: string): Promise<Book> => {
  const filepath = getRecipeSourcePath(BOOK_ROOT, book);
  const data = await readJSONFile<Omit<Book, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Book not found: ${filepath}`);

  return {
    ...data,
    type: 'book',
    slug: book,
    recipeAmount: await getRecipeAmount(BOOK_ROOT, book),
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
    recipeAmount: await getRecipeAmount(YOUTUBE_CHANNEL_ROOT, slug),
  };
});

export const getSource = async (type: Source['type'], slug: string): Promise<Source> => {
  return match(type)
    .with('book', () => getBook(slug))
    .with('youtube-channel', () => getYoutubeChannel(slug))
    .exhaustive();
};

export const getAllSources = memo(async () => {
  const sourcePromises: Promise<Source>[] = [];

  for await (const sourceType of await fs.readdir(RECIPE_ROOT)) {
    for await (const sourceSlug of await fs.readdir(path.join(RECIPE_ROOT, sourceType))) {
      sourcePromises.push(getSource(sourceType as Source['type'], sourceSlug));
    }
  }

  const sources = await Promise.all(sourcePromises);
  sources.sort((a, b) => a.name.localeCompare(b.name));

  return sources;
});
