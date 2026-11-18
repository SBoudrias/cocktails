import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import type { Category } from '../types/Category.ts';
import type { Ref } from '../types/Ref.ts';
import { getSystemCategoryNodes } from './categorization-systems.ts';
import { CATEGORY_ROOT } from './constants';
import { readJSONFile } from './fs';
import memo from './memo';

export const getCategory = memo(async (category: string): Promise<Category> => {
  const filepath = path.join(CATEGORY_ROOT, `${category}.json`);
  const data = await readJSONFile<
    Omit<Category, 'slug' | 'parents' | 'category'> & { refs?: Ref[]; parents?: string[] }
  >(filepath);

  if (!data) {
    // A categorization system node with this slug: the fallback for
    // categories whose loose file has been migrated into a system file.
    const systemNode = (await getSystemCategoryNodes()).get(category)?.data;

    if (!systemNode) throw new Error(`Category not found: ${filepath}`);

    return {
      name: systemNode.name,
      categoryType: systemNode.categoryType,
      description: systemNode.description,
      refs: systemNode.refs ?? [],
      parents: await Promise.all(
        (systemNode.parents ?? []).map((name) => getCategory(slugify(name))),
      ),
      slug: category,
      type: 'category' as const,
    };
  }

  return {
    ...data,
    refs: data.refs ?? [],
    parents: await Promise.all(
      (data.parents ?? []).map((name) => getCategory(slugify(name))),
    ),
    slug: category,
    type: 'category' as const,
  };
});

export const getAllCategories = memo(async (): Promise<Category[]> => {
  const categories: Category[] = [];
  const systemNodes = await getSystemCategoryNodes();

  for (const file of await fs.readdir(CATEGORY_ROOT)) {
    const ingredient = await getCategory(path.basename(file, '.json'));
    categories.push(ingredient);
    systemNodes.delete(ingredient.slug);
  }

  // System nodes whose loose file is gone: standalone categories.
  for (const slug of systemNodes.keys()) {
    categories.push(await getCategory(slug));
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
    const visited = new Set([parent.slug]);
    const subcategories: Category[] = [];

    const collectSubcategories = (parentSlug: string) => {
      for (const category of categoriesPerParent[parentSlug] ?? []) {
        if (visited.has(category.slug)) continue;

        visited.add(category.slug);
        subcategories.push(category);
        collectSubcategories(category.slug);
      }
    };

    collectSubcategories(parent.slug);

    return subcategories.toSorted((a, b) => a.name.localeCompare(b.name));
  },
  (category) => category.slug,
);

/**
 * The substitution-friendly neighbors of a category in the category tree:
 * its direct parents and its siblings (the other children of those parents),
 * e.g. for a Jamaican aged rum category, the other aged-rum categories.
 * The category itself is never included.
 *
 * Siblings under a non-substituting parent stay out: when a category is
 * declared `"substitutable": false`, its children are flavor or appellation
 * islands (e.g. the flavored vodkas under Vodka) that cannot stand in for
 * one another. The parent itself is still a neighbor — a plain version of
 * the base spirit is a loose substitute for a flavored one.
 */
export const getRelatedCategories = memo(
  async (category: Category): Promise<Category[]> => {
    const categoriesByParent = await getCategoriesPerParent();

    const substitutableParents = category.parents.filter(
      ({ substitutable }) => substitutable !== false,
    );

    const relatedCategories = [
      ...category.parents,
      ...substitutableParents.flatMap(({ slug }) => categoriesByParent[slug] ?? []),
    ].filter(({ slug }) => slug !== category.slug);

    const seen = new Set<string>();

    return relatedCategories
      .filter(({ slug }) => {
        const isDuplicate = seen.has(slug);
        seen.add(slug);
        return !isDuplicate;
      })
      .toSorted((a, b) => a.name.localeCompare(b.name));
  },
  (category) => category.slug,
);
