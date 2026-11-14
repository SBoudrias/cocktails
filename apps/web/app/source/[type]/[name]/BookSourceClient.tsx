'use client';

import type { Book } from '@cocktails/data';
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
import { LinkList } from '#/components/LinkList';
import RecipeLinkListItem from '#/components/RecipeLinkListItem';
import RecipeSearchableList from '#/components/RecipeSearchableList';
import SearchAllLink from '#/components/SearchAllLink';
import SearchHeader from '#/components/SearchHeader';
import SourceAboutCard from '#/components/SourceAboutCard';
import useLocalStorage from '#/hooks/useLocalStorage';
import { createByChapterListConfig } from '#/modules/lists/by-chapter';
import { byNameListConfig } from '#/modules/lists/by-name';
import type { RecipeListItem } from '#/modules/recipeListItem';

type GroupMode = 'chapter' | 'alphabetical';

export default function BookSourceClient({
  source,
  recipes,
}: {
  source: Book;
  recipes: RecipeListItem[];
}) {
  const [searchTerm, setSearchTerm] = useQueryState('search');
  const [groupMode, setGroupMode] = useLocalStorage<GroupMode>(
    'book-grouping',
    'chapter',
  );

  const hasChapters = recipes.some((r) => r.chapter);
  const isSearching = searchTerm != null && searchTerm.trim() !== '';

  const chapterConfig = useMemo(() => createByChapterListConfig(recipes), [recipes]);

  const renderRecipe = useCallback((recipe: RecipeListItem): React.ReactNode => {
    return (
      <RecipeLinkListItem
        key={recipe.href}
        href={recipe.href}
        name={recipe.name}
        source={recipe.source}
      />
    );
  }, []);

  // Chapter-grouped rows sit under a header that already names the chapter;
  // repeating it in each row's secondary line is noise, so rows only carry
  // the book name there.
  const renderRecipeWithoutChapter = useCallback(
    (recipe: RecipeListItem): React.ReactNode => {
      return (
        <RecipeLinkListItem
          key={recipe.href}
          href={recipe.href}
          name={recipe.name}
          source={source.name}
        />
      );
    },
    [source.name],
  );

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
        <RecipeSearchableList
          items={recipes}
          renderItem={renderRecipe}
          searchTerm={searchTerm}
          emptyState={emptyState}
        />
      </>
    );
  }

  const isChapterGrouped = hasChapters && groupMode === 'chapter';

  const listConfig = isChapterGrouped ? chapterConfig : byNameListConfig;
  const listRenderRecipe = isChapterGrouped ? renderRecipeWithoutChapter : renderRecipe;

  return (
    <>
      <SearchHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <SourceAboutCard source={source} sx={{ m: 2 }} />
      {hasChapters && (
        <Stack direction="row-reverse" sx={{ mx: 2 }}>
          <GroupModeToggle value={groupMode} onChange={setGroupMode} />
        </Stack>
      )}
      <LinkList items={recipes} config={listConfig} renderItem={listRenderRecipe} />
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
