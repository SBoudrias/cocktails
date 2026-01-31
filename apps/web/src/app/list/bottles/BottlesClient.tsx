'use client';

import type { BaseIngredient } from '@cocktails/data/client';
import {
  byNameListConfig,
  getIngredientOrCategorySearchText,
} from '@cocktails/data/client';
import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import { LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import { getIngredientUrl } from '@/modules/url';

function renderBottle(bottle: BaseIngredient) {
  return (
    <LinkListItem
      key={bottle.slug}
      href={getIngredientUrl(bottle)}
      primary={bottle.name}
    />
  );
}

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
        config={byNameListConfig}
        renderItem={renderBottle}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
