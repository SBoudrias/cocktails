import { getCategory } from '@cocktails/data/categories';
import { getIngredient } from '@cocktails/data/ingredients';
import { describe, expect, it } from 'vitest';
import { getIngredientUrl } from '#/modules/url';
import { toIngredientListItems } from './ingredientListItem';

describe('toIngredientListItems', () => {
  it('keeps only what a list row renders and searches', async () => {
    const ingredient = await getIngredient('spirit', 'appleton-signature');
    const category = await getCategory('aged-rum');

    const [ingredientItem, categoryItem] = toIngredientListItems([ingredient, category]);

    expect(ingredientItem).toEqual({
      name: ingredient.name,
      href: getIngredientUrl(ingredient),
      searchText: expect.stringContaining('appleton'),
    });
    expect(categoryItem).toEqual({
      name: category.name,
      href: getIngredientUrl(category),
      searchText: expect.stringContaining('aged rum'),
    });
  });
});
