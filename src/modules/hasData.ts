import { Category } from '@/types/Category';
import { RecipeIngredient } from '@/types/Recipe';

export function categoryHasData(category: Category) {
  return category.description || category.parents.length > 0 || category.refs.length > 0;
}

export function ingredientHasData(ingredient: RecipeIngredient) {
  const relatedCategories: Category[] = [
    ...('categories' in ingredient ? ingredient.categories : []),
    ...('parents' in ingredient ? ingredient.parents : []),
  ];

  return (
    ingredient.description ||
    ingredient.refs.length > 0 ||
    ingredient.type === 'category' ||
    relatedCategories.length > 0
  );
}
