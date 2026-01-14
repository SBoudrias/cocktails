'use client';

import Link from 'next/link';
import type { BaseIngredient } from '@/types/Ingredient';
import { getIngredientOrCategorySearchText } from '@/modules/searchText';
import { getIngredientUrl } from '@/modules/url';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { useQueryState } from 'nuqs';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import SearchAllLink from '@/components/SearchAllLink';

export default function BottlesClient({ bottles }: { bottles: BaseIngredient[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
        <CardContent>
          <Typography variant="body2">
            No bottles matched the search term &quot;{searchTerm}&quot;
          </Typography>
        </CardContent>
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  const renderItem = (items: BaseIngredient[], header?: string) => {
    const headerId = header ? `group-header-${header}` : undefined;

    return (
      <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
        {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
        <Paper square>
          {items.map((bottle) => (
            <Link href={getIngredientUrl(bottle)} key={bottle.slug}>
              <ListItem divider secondaryAction={<ChevronRight />}>
                <ListItemText
                  primary={bottle.name}
                  sx={{ textTransform: 'capitalize' }}
                />
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
        title="All Bottles"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={bottles}
        getSearchText={getIngredientOrCategorySearchText}
        renderItem={renderItem}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
