import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { SourceType, Book, YoutubeChannel, Source } from '@/types/Source';
import path from 'node:path';

const DATA_ROOT = 'src/data';
const BOOK_ROOT = 'src/data/book';
const YOUTUBE_CHANNEL_ROOT = 'src/data/youtube-channel';

async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function readJSONFile<T>(filepath: string): Promise<T | undefined> {
  if (await fileExists(filepath)) {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  return undefined;
}

export async function getRecipe(
  source: {
    type: SourceType;
    slug: string;
  },
  recipe: string,
): Promise<Recipe | undefined> {
  const filepath = path.join(
    DATA_ROOT,
    source.type,
    source.slug,
    `recipes/${recipe}.json`,
  );
  const data = await readJSONFile<Omit<Recipe, 'source' | 'slug' | 'refs'>>(filepath);

  if (!data) return undefined;

  return {
    refs: [],
    ...data,
    slug: recipe,
    source,
  };
}

export async function getBook(book: string): Promise<Book | undefined> {
  const filepath = path.join(BOOK_ROOT, book, 'source.json');
  const data = await readJSONFile<Omit<Book, 'slug' | 'type'>>(filepath);

  if (!data) return undefined;

  return {
    ...data,
    type: 'book',
    slug: book,
  };
}

export async function getYoutubeChannel(
  slug: string,
): Promise<YoutubeChannel | undefined> {
  const filepath = path.join(YOUTUBE_CHANNEL_ROOT, slug, 'source.json');
  const data = await readJSONFile<Omit<YoutubeChannel, 'slug' | 'type'>>(filepath);

  if (!data) return undefined;

  return {
    ...data,
    type: 'youtube-channel',
    slug: slug,
  };
}

export async function getAllData(): Promise<{
  sources: Source[];
  recipes: Recipe[];
}> {
  const sources: Source[] = [];
  const recipes: Recipe[] = [];

  for await (const slug of await fs.readdir(BOOK_ROOT)) {
    const book = await getBook(slug);
    if (!book) continue;
    sources.push(book);

    for await (const recipeSlug of await fs.readdir(
      path.join(BOOK_ROOT, slug, 'recipes'),
    )) {
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
    if (!channel) continue;
    sources.push(channel);

    for await (const recipeSlug of await fs.readdir(
      path.join(YOUTUBE_CHANNEL_ROOT, slug, 'recipes'),
    )) {
      const recipe = await getRecipe(
        { type: 'youtube-channel', slug },
        path.basename(recipeSlug, '.json'),
      );
      if (!recipe) continue;
      recipes.push(recipe);
    }
  }

  console.log(sources, recipes);
  return { sources, recipes };
}
