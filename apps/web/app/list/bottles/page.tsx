import { getAllIngredients } from '@cocktails/data/ingredients';
import type { Metadata } from 'next';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { toIngredientListItems } from '#/modules/ingredientListItem';

export const metadata: Metadata = {
  title: 'Indexotica | Bottle list',
};

export default async function BottlesPage() {
  const allIngredients = await getAllIngredients();

  const bottles = allIngredients.filter((ingredient) => {
    return (
      ingredient.type === 'liqueur' ||
      ingredient.type === 'spirit' ||
      ingredient.type === 'non-alcoholic'
    );
  });

  return (
    <>
      <SearchHeader title="All Bottles" />
      <SearchableList
        rows={toIngredientListItems(bottles).map(({ name, href, searchText }) => ({
          name,
          node: <LinkListItem href={href} primary={name} />,
          searchText,
        }))}
        emptyState={
          <Card m={2}>
            <CardHeader>
              <CardTitle>No results found</CardTitle>
            </CardHeader>
          </Card>
        }
      />
    </>
  );
}
