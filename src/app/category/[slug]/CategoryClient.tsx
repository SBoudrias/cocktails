'use client';

import { useCallback } from 'react';
import type { Category } from '@/types/Category';
import type { Recipe } from '@/types/Recipe';
import { LinkListItem } from '@/components/LinkList';
import Quantity from '@/components/Quantity';
import RecipeList, { getRecipeAttribution } from '@/components/RecipeList';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import { getRecipeUrl } from '@/modules/url';

export default function CategoryClient({
  category,
  relatedRecipes,
  categorySlugs,
}: {
  category: Category;
  relatedRecipes: Recipe[];
  categorySlugs: string[];
}) {
  const recipeNameIsUnique = useNameIsUnique(relatedRecipes);

  const renderRecipe = useCallback(
    (recipe: Recipe) => {
      // Find the first ingredient that matches this category
      const ing = recipe.ingredients.find((ingredient) => {
        if (ingredient.type === 'category') {
          return ingredient.slug === category.slug;
        }
        return ingredient.categories.some((c) => categorySlugs.includes(c.slug));
      });
      const recipeUrl = getRecipeUrl(recipe);

      return (
        <LinkListItem
          key={recipeUrl}
          href={recipeUrl}
          primary={recipe.name}
          secondary={
            recipeNameIsUnique(recipe) ? undefined : getRecipeAttribution(recipe)
          }
          tertiary={ing && <Quantity quantity={ing.quantity} preferredUnit="oz" />}
        />
      );
    },
    [category.slug, categorySlugs, recipeNameIsUnique],
  );

  return (
    <RecipeList
      recipes={relatedRecipes}
      header={`Recipes using ${category.name}`}
      renderRecipe={renderRecipe}
    />
  );
}
