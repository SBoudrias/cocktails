import { getAllCategories } from '@cocktails/data/categories';
import { getAllIngredients } from '@cocktails/data/ingredients';
import type { Metadata } from 'next';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { toIngredientListItems } from '#/modules/ingredientListItem';
import { byNameListConfig } from '#/modules/lists/by-name';

export const metadata: Metadata = {
  title: 'Indexotica | Ingredient list',
};

export default async function IngredientListPage() {
  const [allIngredients, allCategories] = await Promise.all([
    getAllIngredients(),
    getAllCategories(),
  ]);
  const ingredients = allIngredients.filter((ingredient) => {
    return (
      ingredient.type !== 'liqueur' &&
      ingredient.type !== 'spirit' &&
      ingredient.type !== 'non-alcoholic'
    );
  });

  return (
    <>
      <SearchHeader title="All Ingredients" />
      <SearchableList
        rows={toIngredientListItems([...ingredients, ...allCategories]).map(
          ({ name, href, searchText }) => ({
            name,
            // Ingredient names ship lowercase in the data ("lime", "green
            // apple"), so the rows title-case them like the recipe
            // ingredient list does.
            node: (
              <LinkListItem
                href={href}
                primary={<span className="capitalize">{name}</span>}
              />
            ),
            searchText,
          }),
        )}
        config={byNameListConfig}
        emptyState={
          <>
            <Card m={2}>
              <CardHeader>
                <CardTitle>No results found</CardTitle>
              </CardHeader>
            </Card>
            <SearchAllLink />
          </>
        }
      />
    </>
  );
}
