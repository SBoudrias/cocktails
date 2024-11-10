import path from 'node:path';
import memo from 'lodash/memoize';
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
