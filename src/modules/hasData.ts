import { Category } from '@/types/Category';
import { RecipeIngredient, RootIngredient } from '@/types/Ingredient';

export function categoryHasData(category: Category) {
  return category.description || category.parents.length > 0 || category.refs.length > 0;
}

export function ingredientHasData(ingredient: RootIngredient | RecipeIngredient) {
  const relatedCategories: Category[] = [
    ...('categories' in ingredient ? ingredient.categories : []),
    ...('parents' in ingredient ? ingredient.parents : []),
  ];

  return (
    ingredient.description ||
    ingredient.refs.length > 0 ||
    ('ingredients' in ingredient && ingredient.ingredients.length > 0) ||
    ingredient.type === 'category' ||
    relatedCategories.length > 0
  );
}
