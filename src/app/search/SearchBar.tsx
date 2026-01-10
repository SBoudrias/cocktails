'use client';

import { Recipe } from '@/types/Recipe';
import { useMemo } from 'react';
import { fuzzySearch } from '@/modules/fuzzySearch';
import { getRecipeSearchText } from '@/modules/searchText';
import {
  AppBar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  Toolbar,
  Typography,
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { useQueryState } from 'nuqs';
import RecipeList from '@/components/RecipeList';
import groupByFirstLetter from '@/modules/groupByFirstLetter';
import SearchInput from '@/components/SearchInput';

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Toolbar>
      <IconButton size="large" edge="start" aria-label="Go back" href="/">
        <ChevronLeft />
      </IconButton>
      <SearchInput value={value} onChangeAction={onChange} autoFocus />
    </Toolbar>
  );
}

export default function SearchPage({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useQueryState('search');

  const nameIsUnique = useMemo(() => {
    // Normalize names to lower case to avoid case sensitivity
    const store = Object.groupBy(recipes, (recipe) => recipe.name.toLowerCase());
    return (name: string) => store[name.toLowerCase()]?.length === 1;
  }, [recipes]);

  const haystack = useMemo(() => recipes.map(getRecipeSearchText), [recipes]);

  const searchMatches = useMemo(
    () => fuzzySearch(recipes, haystack, searchTerm),
    [haystack, recipes, searchTerm],
  );

  let content;
  if (searchMatches.length > 0) {
    content = <RecipeList recipes={searchMatches} isNameUniqueFn={nameIsUnique} />;
  } else if (!searchTerm || searchTerm.trim().length === 0) {
    const groups = groupByFirstLetter(recipes);

    content = (
      <List>
        {groups.map(([letter, recipes]) => {
          if (!recipes) return;

          return (
            <li key={letter}>
              <RecipeList
                recipes={recipes}
                header={letter}
                isNameUniqueFn={nameIsUnique}
              />
            </li>
          );
        })}
      </List>
    );
  } else {
    content = (
      <Card sx={{ m: 2 }}>
        <CardHeader title="No results found" />
        <CardContent>
          <Typography variant="body2">
            No recipes or ingredients matched the search term &quot;{searchTerm}&quot;
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AppBar>
        <SearchBar onChange={setSearchTerm} value={searchTerm ?? ''} />
      </AppBar>
      <Toolbar />
      {content}
    </>
  );
}
