import { getAllRecipes } from '@cocktails/data/recipes';
import type { Metadata } from 'next';
import { LinkListItem } from '#/components/LinkList';
import SearchableList from '#/components/SearchableList';
import SearchHeader from '#/components/SearchHeader';
import { Card, CardHeader, CardTitle } from '#/components/ui/card';
import { byNameListConfig } from '#/modules/lists/by-name';
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
        const author = authorsMap.get(authorName) || {
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
        config={byNameListConfig}
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
