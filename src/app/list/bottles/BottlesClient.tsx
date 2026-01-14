'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import type { BaseIngredient } from '@/types/Ingredient';
import { LinkList, LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getIngredientOrCategorySearchText } from '@/modules/searchText';
import { getIngredientUrl } from '@/modules/url';

export default function BottlesClient({ bottles }: { bottles: BaseIngredient[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
    </Card>
  );

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
        renderItem={(items, header) => (
          <LinkList
            items={items}
            header={header}
            renderItem={(bottle) => (
              <LinkListItem
                key={bottle.slug}
                href={getIngredientUrl(bottle)}
                primary={bottle.name}
              />
            )}
          />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
