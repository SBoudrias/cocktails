'use client';

import type { Book, Recipe } from '@cocktails/data';
import {
  Card,
  CardContent,
  CardHeader,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import IndexedList from '#/components/IndexedList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import SearchableList from '#/components/SearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import SourceAboutCard from '#/components/SourceAboutCard';
import useLocalStorage from '#/hooks/useLocalStorage';
import { getRecipeSource } from '#/modules/getRecipeSource';
import { createByChapterListConfig } from '#/modules/lists/by-chapter';
import { byNameListConfig } from '#/modules/lists/by-name';
import { getRecipeSearchText } from '#/modules/searchText';
import { getRecipeUrl } from '#/modules/url';

type GroupMode = 'chapter' | 'alphabetical';

export default function BookSourceClient({
  source,
  recipes,
}: {
  source: Book;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const [groupMode, setGroupMode] = useLocalStorage<GroupMode>(
    'book-grouping',
    'chapter',
  );

  const hasChapters = recipes.some((r) => r.chapter);
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const chapterConfig = useMemo(() => createByChapterListConfig(recipes), [recipes]);

  const renderRecipe = useCallback((recipe: Recipe): React.ReactNode => {
    const href = getRecipeUrl(recipe);
    return (
      <RecipeLinkListItem
        key={href}
        href={href}
        name={recipe.name}
        source={getRecipeSource(recipe)}
      />
    );
  }, []);

  const emptyState = (
    <>
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
        <CardContent>
          <Typography variant="body2">
            No recipes matched the search term &quot;{searchTerm}&quot;
          </Typography>
        </CardContent>
      </Card>
      <SearchAllLink searchTerm={searchTerm} />
    </>
  );

  // When searching, use SearchableList
  if (isSearching) {
    return (
      <>
        <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      </>
    );
  }

  const listConfig =
    hasChapters && groupMode === 'chapter' ? chapterConfig : byNameListConfig;

  return (
    <>
      <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <SourceAboutCard
        source={source}
        // Reserve room for the floating index bar on narrow viewports
        sx={{ m: 2, '@media (max-width: 680px)': { mr: 5 } }}
      />
      {hasChapters && (
        <Stack
          direction="row-reverse"
          sx={{ mx: 2, '@media (max-width: 680px)': { mr: 5 } }}
        >
          <GroupModeToggle value={groupMode} onChange={setGroupMode} />
        </Stack>
      )}
      <IndexedList items={recipes} config={listConfig} renderItem={renderRecipe} />
    </>
  );
}

function GroupModeToggle({
  value,
  onChange,
}: {
  value: GroupMode;
  onChange: (value: GroupMode) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue: GroupMode | null) => {
        if (newValue) onChange(newValue);
      }}
      size="small"
      aria-label="Recipe grouping"
    >
      <ToggleButton value="chapter">By Chapter</ToggleButton>
      <ToggleButton value="alphabetical">A-Z</ToggleButton>
    </ToggleButtonGroup>
  );
}
