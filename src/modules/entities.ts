import fs from 'node:fs/promises';
import { Recipe } from '@/types/Recipe';
import { Book } from '@/types/Source';

async function fileExists(filepath: string): Promise<boolean> {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

async function readJSONFile(filepath: string): Promise<any> {
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
  return await readJSONFile(filepath);
}

export async function getBook(book: string): Promise<Book | undefined> {
  const filepath = `src/data/books/${book}/source.json`;
  return await readJSONFile(filepath);
}
