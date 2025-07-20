import { Metadata } from 'next';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';
import { getAllRecipes } from '@/modules/recipes';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { getAuthorRecipesUrl } from '@/modules/url';
import { ChevronRight } from '@mui/icons-material';
import groupByFirstLetter from '@/modules/groupByFirstLetter';

export const metadata: Metadata = {
  title: 'Cocktail Index | Authors list',
};

export default async function AuthorListPage() {
  const allRecipes = await getAllRecipes();

  // Extract unique authors from recipe attributions
  const authorsMap = new Map<string, { name: string; recipeCount: number }>();

  allRecipes.forEach((recipe) => {
    recipe.attributions
      .filter((attribution) => attribution.relation === 'recipe author')
      .forEach((attribution) => {
        const authorName = attribution.source;
        const author = authorsMap.get(authorName) || { name: authorName, recipeCount: 0 };
        author.recipeCount += 1;
        authorsMap.set(authorName, author);
      });
  });

  // Convert to array and sort
  const authors = Array.from(authorsMap.values());

  // Group authors by first letter
  const authorGroups = groupByFirstLetter(authors);

  return (
    <Suspense>
      <AppHeader title="All Authors" />
      <List>
        {authorGroups.map(([letter, authors]) => {
          if (!authors) return null;

          return (
            <li key={letter}>
              <List>
                <ListSubheader>{letter}</ListSubheader>
                <Paper square>
                  {authors.map((author) => (
                    <Link href={getAuthorRecipesUrl(author.name)} key={author.name}>
                      <ListItem divider secondaryAction={<ChevronRight />}>
                        <ListItemText
                          primary={author.name}
                          secondary={`${author.recipeCount} recipe${author.recipeCount !== 1 ? 's' : ''}`}
                        />
                      </ListItem>
                    </Link>
                  ))}
                </Paper>
              </List>
            </li>
          );
        })}
      </List>
    </Suspense>
  );
}
