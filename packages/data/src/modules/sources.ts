import memo from 'lodash/memoize';
import fs from 'node:fs/promises';
import path from 'node:path';
import { match } from 'ts-pattern';
import type { Book, Source, YoutubeChannel, Podcast } from '../types/Source.ts';
import { isChapterFolder } from './chapters';
import { BOOK_ROOT, RECIPE_ROOT, YOUTUBE_CHANNEL_ROOT, PODCAST_ROOT } from './constants';
import { readJSONFile } from './fs';

function getRecipeSourcePath(root: string, slug: string): string {
  return path.join(root, slug, '_source.json');
}

async function getRecipeAmount(root: string, slug: string): Promise<number> {
  const folderPath = path.join(root, slug);
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory() && isChapterFolder(entry.name)) {
      const chapterFiles = await fs.readdir(path.join(folderPath, entry.name));
      count += chapterFiles.filter((f) => f.endsWith('.json')).length;
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      entry.name !== '_source.json'
    ) {
      count++;
    }
  }
  return count;
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

export const getPodcast = memo(async (slug: string): Promise<Podcast> => {
  const filepath = getRecipeSourcePath(PODCAST_ROOT, slug);
  const data = await readJSONFile<Omit<Podcast, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Podcast not found: ${filepath}`);

  return {
    ...data,
    type: 'podcast',
    slug: slug,
    recipeAmount: await getRecipeAmount(PODCAST_ROOT, slug),
  };
});

export const getSource = async (type: Source['type'], slug: string): Promise<Source> => {
  return match(type)
    .with('book', () => getBook(slug))
    .with('youtube-channel', () => getYoutubeChannel(slug))
    .with('podcast', () => getPodcast(slug))
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
