import path from 'node:path';
import memo from 'lodash/memoize';
import fs from 'node:fs/promises';
import { Category } from '@/types/Category';
import { CATEGORY_ROOT } from './constants';
import { readJSONFile } from './fs';
import slugify from '@sindresorhus/slugify';
import { Ref } from '@/types/Ref';

export const getCategory = memo(async (category: string): Promise<Category> => {
  const filepath = path.join(CATEGORY_ROOT, `${category}.json`);
  const data = await readJSONFile<
    Omit<Category, 'slug' | 'parents'> & { refs?: Ref[]; parents?: string[] }
  >(filepath);

  if (!data) throw new Error(`Category not found: ${filepath}`);

  return {
    ...data,
    refs: data.refs ?? [],
    parents: await Promise.all(
      (data.parents ?? []).map((name) => getCategory(slugify(name))),
    ),
    slug: category,
  };
});

export const getAllCategories = memo(async (): Promise<Category[]> => {
  const categories: Category[] = [];

  for await (const file of await fs.readdir(CATEGORY_ROOT)) {
    const ingredient = await getCategory(path.basename(file, '.json'));
    categories.push(ingredient);
  }

  return categories;
});

export const getCategoriesPerParent = memo(
  async (): Promise<Record<string, Category[]>> => {
    const categoriesMap: Record<string, Category[]> = {};

    for (const category of await getAllCategories()) {
      category.parents.forEach(({ slug }) => {
        if (Array.isArray(categoriesMap[slug])) {
          categoriesMap[slug].push(category);
        } else {
          categoriesMap[slug] = [category];
        }
      });
    }

    return categoriesMap;
  },
);

export const getChildCategories = memo(
  async (parent: Category): Promise<Category[]> => {
    const categoriesPerParent = await getCategoriesPerParent();
    return categoriesPerParent[parent.slug] ?? [];
  },
  (category) => category.slug,
);
