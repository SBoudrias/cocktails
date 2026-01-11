'use client';

import Link from 'next/link';
import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import { getListItemSearchText } from '@/modules/searchText';
import { getIngredientUrl } from '@/modules/url';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useQueryState } from 'nuqs';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';

export default function IngredientsClient({
  ingredients,
}: {
  ingredients: (BaseIngredient | Category)[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
      <CardContent>
        <Typography variant="body2">
          No ingredients matched the search term &quot;{searchTerm}&quot;
        </Typography>
      </CardContent>
    </Card>
  );

  const renderItem = (items: (BaseIngredient | Category)[], header?: string) => {
    const headerId = header ? `group-header-${header}` : undefined;

    return (
      <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
        {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
        <Paper square>
          {items.map((ingredient) => (
            <Link href={getIngredientUrl(ingredient)} key={ingredient.slug}>
              <ListItem divider secondaryAction={<ChevronRight />}>
                <ListItemText primary={ingredient.name} />
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
        title="All Ingredients"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={ingredients}
        getSearchText={getListItemSearchText}
        renderItem={renderItem}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
