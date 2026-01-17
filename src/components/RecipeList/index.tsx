import type { Recipe } from '@/types/Recipe';
import { getRecipeUrl } from '@/modules/url';
import { LinkList, LinkListItem } from '../LinkList';

function defaultRenderRecipe(recipe: Recipe) {
  return (
    <LinkListItem key={recipe.slug} href={getRecipeUrl(recipe)} primary={recipe.name} />
  );
}

export default function RecipeList({
  recipes,
  header,
  renderRecipe = defaultRenderRecipe,
}: {
  recipes: Recipe[];
  header?: string;
  renderRecipe?: (recipe: Recipe) => React.ReactNode;
}) {
  return <LinkList items={recipes} header={header} renderItem={renderRecipe} />;
}
