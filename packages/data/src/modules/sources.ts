import fs from 'node:fs/promises';
import path from 'node:path';
import { match } from 'ts-pattern';
import type { Book, Source, YoutubeChannel, Podcast } from '../types/Source.ts';
import { isChapterFolder } from './chapters';
import { BOOK_ROOT, RECIPE_ROOT, YOUTUBE_CHANNEL_ROOT, PODCAST_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

function getRecipeSourcePath(root: string, slug: string): string {
  return path.join(root, slug, '_source.json');
}

/**
 * Count of recipes listed on each youtube channel page.
 *
 * Mirrors the dynamic channel listing in `recipes.ts`: a recipe appears under a
 * channel when its file lives in that channel's folder or when one of its
 * youtube refs points to that channel. Counted per distinct recipe file, so a
 * folder recipe referencing its own channel is only counted once.
 */
const getYoutubeChannelRecipeAmounts = memo(async (): Promise<Map<string, number>> => {
  const filesPerChannel = new Map<string, Set<string>>();

  function addRecipeToChannel(channel: string, recipeFile: string): void {
    let files = filesPerChannel.get(channel);
    if (!files) {
      files = new Set<string>();
      filesPerChannel.set(channel, files);
    }
    files.add(recipeFile);
  }

  async function scanDirectory(dirPath: string): Promise<void> {
    for (const entry of await fs.readdir(dirPath, { withFileTypes: true })) {
      if (entry.name === '_source.json') continue;

      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.json')) continue;

      const relPath = path.relative(RECIPE_ROOT, entryPath);
      const parts = relPath.split(path.sep);

      // The folder a recipe file lives in is its owning source.
      const ownerSlug = parts[0] === 'youtube-channel' ? parts[1] : undefined;
      if (ownerSlug) {
        addRecipeToChannel(ownerSlug, relPath);
      }

      const data = await readJSONFile<{ refs?: unknown[] }>(entryPath);
      if (!data) continue;

      for (const ref of data.refs ?? []) {
        if (
          typeof ref === 'object' &&
          ref !== null &&
          'type' in ref &&
          ref.type === 'youtube' &&
          'channel' in ref &&
          typeof ref.channel === 'string'
        ) {
          addRecipeToChannel(ref.channel, relPath);
        }
      }
    }
  }

  await scanDirectory(RECIPE_ROOT);

  return new Map(
    [...filesPerChannel].map(([channel, files]) => [channel, files.size] as const),
  );
});

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

  const recipeAmounts = await getYoutubeChannelRecipeAmounts();

  return {
    ...data,
    type: 'youtube-channel',
    slug: slug,
    recipeAmount: recipeAmounts.get(slug) ?? 0,
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
