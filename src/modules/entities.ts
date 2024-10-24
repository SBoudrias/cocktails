import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { SourceType, Book, YoutubeChannel, Source } from '@/types/Source';
import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import {
  INGREDIENT_ROOT,
  CATEGORY_ROOT,
  RECIPE_ROOT,
  BOOK_ROOT,
  YOUTUBE_CHANNEL_ROOT,
} from './constants';

function getRecipeSourcePath(root: string, slug: string): string {
  return path.join(root, slug, '_source.json');
}

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

const ingredientCache = new Map<string, BaseIngredient>();
export async function getIngredient(type: string, slug: string): Promise<BaseIngredient> {
  const key = `${type}/${slug}`;
  if (ingredientCache.has(key)) {
    return ingredientCache.get(key)!;
  }

  const filepath = path.join(INGREDIENT_ROOT, type, `${slug}.json`);
  const data = await readJSONFile<
    Omit<BaseIngredient, 'slug' | 'categories'> & { categories?: string[] }
  >(filepath);

  if (!data) throw new Error(`Ingredient not found: ${filepath}`);

  const categories = await Promise.all(
    (data.categories ?? []).map((category) => getCategory(slugify(category))),
  );

  const ingredient = {
    ...data,
    slug,
    categories,
  };
  ingredientCache.set(key, ingredient);

  return ingredient;
}

export async function getRecipe(
  source: {
    type: SourceType;
    slug: string;
  },
  recipe: string,
): Promise<Recipe> {
  const filepath = path.join(RECIPE_ROOT, source.type, source.slug, `${recipe}.json`);
  const data = await readJSONFile<Omit<Recipe, 'source' | 'slug' | 'refs'>>(filepath);

  if (!data) throw new Error(`Recipe not found: ${filepath}`);

  return {
    refs: [],
    ...data,
    slug: recipe,
    ingredients: await Promise.all(
      data.ingredients.map(async (ingredient) => {
        return {
          ...(await getIngredient(ingredient.type, slugify(ingredient.name))),
          ...ingredient,
        };
      }),
    ),
    source,
  };
}

export async function getCategory(category: string): Promise<Category> {
  const filepath = path.join(CATEGORY_ROOT, `${category}.json`);
  const data = await readJSONFile<Omit<Category, 'slug'>>(filepath);

  if (!data) throw new Error(`Category not found: ${filepath}`);

  return {
    ...data,
    slug: category,
  };
}

export async function getBook(book: string): Promise<Book> {
  const filepath = getRecipeSourcePath(BOOK_ROOT, book);
  const data = await readJSONFile<Omit<Book, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Book not found: ${filepath}`);

  return {
    ...data,
    type: 'book',
    slug: book,
  };
}

export async function getYoutubeChannel(slug: string): Promise<YoutubeChannel> {
  const filepath = getRecipeSourcePath(YOUTUBE_CHANNEL_ROOT, slug);
  const data = await readJSONFile<Omit<YoutubeChannel, 'slug' | 'type'>>(filepath);

  if (!data) throw new Error(`Youtube channel not found: ${filepath}`);

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
