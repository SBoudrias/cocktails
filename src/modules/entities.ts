import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { Book } from '@/types/Source';
import path from 'node:path';

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
  book: string,
  recipe: string,
): Promise<Recipe | undefined> {
  const filepath = `src/data/books/${book}/recipes/${recipe}.json`;
  const data = await readJSONFile<Omit<Recipe, 'source' | 'slug'>>(filepath);

  if (!data) return undefined;

  return {
    ...data,
    slug: recipe,
    source: {
      type: 'book',
      slug: book,
    },
  };
}

export async function getBook(book: string): Promise<Book | undefined> {
  const filepath = `src/data/books/${book}/source.json`;
  const data = await readJSONFile<Omit<Book, 'slug'>>(filepath);

  if (!data) return undefined;

  return {
    ...data,
    slug: book,
  };
}

export async function getAllData(): Promise<{ books: Book[]; recipes: Recipe[] }> {
  const books: Book[] = [];
  const recipes: Recipe[] = [];

  for await (const bookSlug of await fs.readdir('src/data/books/')) {
    const book = await getBook(bookSlug);
    if (!book) continue;
    books.push(book);

    for await (const recipeSlug of await fs.readdir(
      `src/data/books/${bookSlug}/recipes/`,
    )) {
      const recipe = await getRecipe(bookSlug, path.basename(recipeSlug, '.json'));
      if (!recipe) continue;
      recipes.push(recipe);
    }
  }

  return { books, recipes };
}
