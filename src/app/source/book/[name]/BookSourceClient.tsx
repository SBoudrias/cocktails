'use client';

import { Box, Card, CardContent, CardHeader, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useQueryState } from 'nuqs';
import { useCallback } from 'react';
import type { Recipe } from '@/types/Recipe';
import type { Book } from '@/types/Source';
import { LinkList, LinkListItem } from '@/components/LinkList';
import RecipeList, { getRecipeAttribution } from '@/components/RecipeList';
import SearchableList from '@/components/SearchableList';
import SearchHeader from '@/components/SearchHeader';
import useLocalStorage from '@/hooks/useLocalStorage';
import useNameIsUnique from '@/hooks/useNameIsUnique';
import { groupByChapter } from '@/modules/chapters';
import { getRecipeSearchText } from '@/modules/searchText';
import { getRecipeUrl } from '@/modules/url';

type GroupMode = 'chapter' | 'alphabetical';

export default function BookSourceClient({
  source,
  recipes,
}: {
  source: Book;
  recipes: Recipe[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const [groupMode, setGroupMode] = useLocalStorage<GroupMode>('book-grouping', 'chapter');

  const hasChapters = recipes.some((r) => r.chapter);
  const nameIsUnique = useNameIsUnique(recipes);

  const renderRecipe = useCallback(
    (recipe: Recipe): React.ReactNode => {
      const href = getRecipeUrl(recipe);
      return (
        <LinkListItem
          key={href}
          href={href}
          primary={recipe.name}
          secondary={nameIsUnique(recipe) ? undefined : getRecipeAttribution(recipe)}
        />
      );
    },
    [nameIsUnique],
  );

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
      <CardContent>
        <Typography variant="body2">
          No recipes matched the search term &quot;{searchTerm}&quot;
        </Typography>
      </CardContent>
    </Card>
  );

  // When searching, use SearchableList
  if (searchTerm) {
    return (
      <>
        <SearchHeader
          title={source.name}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <SearchableList
          items={recipes}
          getSearchText={getRecipeSearchText}
          renderItem={(items, header) => (
            <RecipeList recipes={items} header={header} renderRecipe={renderRecipe} />
          )}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      </>
    );
  }

  // Chapter view
  if (hasChapters && groupMode === 'chapter') {
    const chapterGroups = groupByChapter(recipes);

    return (
      <>
        <SearchHeader
          title={source.name}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <GroupModeToggle
          value={groupMode}
          onChange={setGroupMode}
          hasChapters={hasChapters}
        />
        {chapterGroups.map(([chapterName, chapterRecipes]) => (
          <LinkList
            key={chapterName}
            header={chapterName}
            items={chapterRecipes}
            renderItem={renderRecipe}
          />
        ))}
      </>
    );
  }

  // Alphabetical view (default for books without chapters)
  return (
    <>
      <SearchHeader
        title={source.name}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {hasChapters && (
        <GroupModeToggle
          value={groupMode}
          onChange={setGroupMode}
          hasChapters={hasChapters}
        />
      )}
      <SearchableList
        items={recipes}
        getSearchText={getRecipeSearchText}
        renderItem={(items, header) => (
          <RecipeList recipes={items} header={header} renderRecipe={renderRecipe} />
        )}
        searchTerm={null}
        emptyState={emptyState}
      />
    </>
  );
}

function GroupModeToggle({
  value,
  onChange,
  hasChapters,
}: {
  value: GroupMode;
  onChange: (value: GroupMode) => void;
  hasChapters: boolean;
}) {
  if (!hasChapters) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
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
    </Box>
  );
}
