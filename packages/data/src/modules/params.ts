import fs from 'node:fs/promises';
import path from 'node:path';
import type { Source } from '../types/Source.ts';
import { isChapterFolder } from './chapters';
import { CATEGORY_ROOT, INGREDIENT_ROOT, RECIPE_ROOT } from './constants';

export async function getRecipePageParams(): Promise<
  {
    type: Source['type'];
    source: string;
    recipe: string;
  }[]
> {
  const types = await fs.readdir(RECIPE_ROOT);
  const nested = await Promise.all(
    types.map(async (type) => {
      const sourceSlugs = await fs.readdir(path.join(RECIPE_ROOT, type));
      return Promise.all(
        sourceSlugs.map(async (sourceSlug) => {
          const sourcePath = path.join(RECIPE_ROOT, type, sourceSlug);
          const entries = await fs.readdir(sourcePath, { withFileTypes: true });
          const perEntry = await Promise.all(
            entries.map(async (entry) => {
              if (entry.name === '_source.json') return [];

              if (entry.isDirectory() && isChapterFolder(entry.name)) {
                const chapterFiles = await fs.readdir(path.join(sourcePath, entry.name));
                return chapterFiles
                  .filter((filename) => filename.endsWith('.json'))
                  .map((filename) => ({
                    type: type as Source['type'],
                    source: sourceSlug,
                    recipe: path.basename(filename, '.json'),
                  }));
              }
              if (entry.isFile() && entry.name.endsWith('.json')) {
                return [
                  {
                    type: type as Source['type'],
                    source: sourceSlug,
                    recipe: path.basename(entry.name, '.json'),
                  },
                ];
              }
              return [];
            }),
          );
          return perEntry.flat();
        }),
      );
    }),
  );

  return nested.flat(2);
}

export async function getIngredientPageParams(): Promise<
  { type: string; slug: string }[]
> {
  const types = await fs.readdir(INGREDIENT_ROOT);
  const nested = await Promise.all(
    types.map(async (type) => {
      const files = await fs.readdir(path.join(INGREDIENT_ROOT, type));
      return files.map((file) => ({
        type: type as Source['type'],
        slug: path.basename(file, '.json'),
      }));
    }),
  );

  return nested.flat();
}

export async function getSourcePageParams(): Promise<
  { type: Source['type']; name: string }[]
> {
  const types = await fs.readdir(RECIPE_ROOT);
  const nested = await Promise.all(
    types.map(async (type) => {
      const sourceSlugs = await fs.readdir(path.join(RECIPE_ROOT, type));
      return sourceSlugs.map((sourceSlug) => ({
        type: type as Source['type'],
        name: sourceSlug,
      }));
    }),
  );

  return nested.flat();
}

export async function getCategoryPageParams(): Promise<{ slug: string }[]> {
  const files = await fs.readdir(CATEGORY_ROOT);
  return files.map((file) => ({ slug: path.basename(file, '.json') }));
}
