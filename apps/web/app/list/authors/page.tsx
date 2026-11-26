import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { LinkListItem } from '#/components/list/LinkList';
import SearchableList from '#/components/search/SearchableList';
import SearchHeader from '#/components/search/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { getAuthorSearchText } from '#/modules/searchText';
import { getAuthorRecipesUrl } from '#/modules/url';

export const metadata: Metadata = {
  title: 'Indexotica | Authors list',
};

export default async function AuthorListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique authors from recipe attributions
  const authorsMap = new Map<string, { name: string; recipeCount: number }>();

  for (const recipe of allRecipes) {
    for (const attribution of recipe.attributions) {
      if (
        attribution.relation === 'recipe author' ||
        attribution.relation === 'adapted by'
      ) {
        const authorName = attribution.source;
        const author = authorsMap.get(authorName) ?? {
          name: authorName,
          recipeCount: 0,
        };

        author.recipeCount += 1;
        authorsMap.set(authorName, author);
      }
    }
  }

  return (
    <>
      <SearchHeader title="All Authors" />
      <SearchableList
        rows={Array.from(authorsMap.values()).map((author) => ({
          name: author.name,
          node: (
            <LinkListItem
              href={getAuthorRecipesUrl(author.name)}
              primary={author.name}
              count={author.recipeCount}
            />
          ),
          searchText: getAuthorSearchText(author),
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
