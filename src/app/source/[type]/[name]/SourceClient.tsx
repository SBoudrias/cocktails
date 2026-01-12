'use client';

import Link from 'next/link';
import type { Recipe } from '@/types/Recipe';
import type { Source } from '@/types/Source';
import { getRecipeSearchText } from '@/modules/searchText';
import { getRecipeUrl } from '@/modules/url';
import { Card, CardHeader } from '@mui/material';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useQueryState } from 'nuqs';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import SearchAllLink from '@/components/SearchAllLink';
import SourceAboutCard from '@/components/SourceAboutCard';

export default function SourceClient({
  source,
  recipes,
}: {
  source: Source;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderItem = (items: Recipe[], header?: string) => {
    const headerId = header ? `group-header-${header}` : undefined;

    return (
      <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
        {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
        <Paper square>
          {items.map((recipe) => (
            <Link href={getRecipeUrl(recipe)} key={recipe.slug}>
              <ListItem divider secondaryAction={<ChevronRight />}>
                <ListItemText primary={recipe.name} />
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
    );
  };

  return (
    <>
      <SearchHeader
        title={source.name}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SourceAboutCard source={source} sx={{ m: 2 }} />
      <SearchableList
        items={recipes}
        getSearchText={getRecipeSearchText}
        renderItem={renderItem}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
