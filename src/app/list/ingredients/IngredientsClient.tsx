'use client';

import { Card, CardHeader } from '@mui/material';
import { useQueryState } from 'nuqs';
import type { Category } from '@/types/Category';
import type { BaseIngredient } from '@/types/Ingredient';
import { LinkListItem } from '@/components/LinkList';
import SearchableList from '@/components/SearchableList';
import SearchAllLink from '@/components/SearchAllLink';
import SearchHeader from '@/components/SearchHeader';
import { getNameFirstLetter } from '@/modules/getNameFirstLetter';
import { getIngredientOrCategorySearchText } from '@/modules/searchText';
import { getIngredientUrl } from '@/modules/url';

export default function IngredientsClient({
  ingredients,
}: {
  ingredients: (BaseIngredient | Category)[];
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

  return (
    <>
      <SearchHeader
        title="All Ingredients"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <SearchableList
        items={ingredients}
        getSearchText={getIngredientOrCategorySearchText}
        groupBy={getNameFirstLetter}
        renderItem={(ingredient) => (
          <LinkListItem
            key={ingredient.slug}
            href={getIngredientUrl(ingredient)}
            primary={ingredient.name}
          />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
