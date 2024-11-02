import { Recipe } from '@/types/Recipe';
import { SourceType } from '@/types/Source';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import memo from 'lodash/memoize';
import { readJSONFile } from './fs';
import { RECIPE_ROOT } from './constants';
import { getIngredient } from './ingredients';
import { getCategory } from './categories';
import { getBook, getYoutubeChannel } from './sources';

export const getRecipe = memo(
  async (
    source: {
      type: SourceType;
      slug: string;
    },
    recipe: string,
  ): Promise<Recipe> => {
    const filepath = path.join(RECIPE_ROOT, source.type, source.slug, `${recipe}.json`);
    const data = await readJSONFile<Omit<Recipe, 'source' | 'slug'>>(filepath);

    if (!data) throw new Error(`Recipe not found: ${filepath}`);

    const sourceData =
      source.type === 'book'
        ? await getBook(source.slug)
        : await getYoutubeChannel(source.slug);

    return {
      ...data,
      slug: recipe,
      refs: data.refs ?? [],
      attributions: data.attributions ?? [],
      ingredients: await Promise.all(
        data.ingredients.map(async (ingredient) => {
          const ingredientData =
            ingredient.type === 'category'
              ? await getCategory(slugify(ingredient.name))
              : await getIngredient(ingredient.type, slugify(ingredient.name));
          return {
            ...ingredientData,
            ...ingredient,
          };
        }),
      ),
      source: sourceData,
    };
  },
);
