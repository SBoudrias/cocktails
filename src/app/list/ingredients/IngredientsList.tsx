'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { getIngredientUrl } from '@/modules/url';
import groupByFirstLetter from '@/modules/groupByFirstLetter';
import ListSearch from '@/components/ListSearch';
import { useListSearch } from '@/hooks/useListSearch';
import type { BaseIngredient, RootIngredient } from '@/types/Ingredient';
import type { Category } from '@/types/Category';

type IngredientOrCategory = (BaseIngredient | RootIngredient | Category) & {
  slug: string;
  name: string;
};

export type IngredientsListProps = {
  ingredients: IngredientOrCategory[];
};

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    resultsCount,
    totalCount,
  } = useListSearch({
    items: ingredients,
    searchFields: (item) => {
      const fields = [item.name];

      // Add type if it exists
      if ('type' in item && item.type) {
        fields.push(item.type);
      }

      // Add categories if they exist
      if ('categories' in item && Array.isArray(item.categories)) {
        fields.push(...item.categories.map((cat) => cat.name));
      }

      // Add parents for categories
      if ('parents' in item && Array.isArray(item.parents)) {
        fields.push(...item.parents.map((parent) => parent.name));
      }

      return fields;
    },
  });

  // Group items by first letter when not searching
  const groupedItems = useMemo(() => {
    if (isSearching) {
      return null;
    }
    return groupByFirstLetter(filteredItems);
  }, [filteredItems, isSearching]);

  return (
    <>
      <ListSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultsCount={resultsCount}
        totalCount={totalCount}
        isSearching={isSearching}
        placeholder="Search ingredients..."
        sticky
      />

      {/* Empty state when searching and no results */}
      {isSearching && filteredItems.length === 0 && (
        <Card sx={{ m: 2 }} role="status" aria-live="polite">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No ingredients found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No ingredients matched your search for &quot;{searchTerm}&quot;
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search results (flat list) */}
      {isSearching && filteredItems.length > 0 && (
        <List>
          <Paper square>
            {filteredItems.map((ingredient) => (
              <Link href={getIngredientUrl(ingredient)} key={ingredient.slug}>
                <ListItem divider secondaryAction={<ChevronRight />}>
                  <ListItemText primary={ingredient.name} />
                </ListItem>
              </Link>
            ))}
          </Paper>
        </List>
      )}

      {/* Grouped list when not searching */}
      {!isSearching && groupedItems && (
        <List>
          {groupedItems.map(([letter, ingredients]) => {
            if (!Array.isArray(ingredients)) return null;

            return (
              <List key={letter}>
                <ListSubheader>{letter}</ListSubheader>
                <Paper square>
                  {ingredients.map((ingredient) => (
                    <Link href={getIngredientUrl(ingredient)} key={ingredient.slug}>
                      <ListItem divider secondaryAction={<ChevronRight />}>
                        <ListItemText primary={ingredient.name} />
                      </ListItem>
                    </Link>
                  ))}
                </Paper>
              </List>
            );
          })}
        </List>
      )}
    </>
  );
}
