'use client';

import { Recipe } from '@/types/Recipe';
import { useMemo, useRef } from 'react';
import uFuzzy from '@leeoniya/ufuzzy';
import transliterate from '@sindresorhus/transliterate';
import { formatIngredientName } from '@/modules/technique';
import {
  AppBar,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  InputBase,
  List,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { useQueryState } from 'nuqs';
import { Category } from '@/types/Category';
import RecipeList from '@/components/RecipeList';
import groupByFirstLetter from '@/modules/groupByFirstLetter';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  height: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string | null) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <Toolbar>
      <Stack direction="row" sx={{ flexGrow: 1 }}>
        <IconButton size="large" edge="start" aria-label="Go back" href="/">
          <ChevronLeft />
        </IconButton>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            ref={searchInputRef}
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            type="search"
            autoFocus
            onKeyUp={(e) => {
              if (e.code === 'Enter') {
                e.currentTarget.blur();
              }
            }}
          />
        </Search>
        <Button
          type="reset"
          onClick={() => {
            onChange(null);
            searchInputRef.current?.querySelector('input')?.focus();
          }}
        >
          Clear
        </Button>
      </Stack>
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

  const haystack = useMemo(
    () =>
      recipes.map((recipe) => {
        return transliterate(
          `${recipe.name} ${recipe.ingredients
            .map((ingredient) => {
              const relatedCategories: Category[] = [
                ...('categories' in ingredient ? ingredient.categories : []),
                ...('parents' in ingredient ? ingredient.parents : []),
              ];
              return `${formatIngredientName(ingredient)} ${relatedCategories.join(' ')}`;
            })
            .join(
              ' ',
            )} ${recipe.attributions.map((attribution) => attribution.source).join(' ')}`,
        ).toLowerCase();
      }),
    [recipes],
  );

  const searchMatches = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length === 0) return [];

    const uf = new uFuzzy();
    const [matchIndexes] = uf.search(
      haystack,
      transliterate(searchTerm).toLowerCase(),
      0,
      1e3,
    );

    if (Array.isArray(matchIndexes) && matchIndexes.length > 0) {
      return matchIndexes
        .map((index) => recipes[index])
        .filter((recipe) => recipe != null);
    }

    // No matches found
    return [];
  }, [haystack, recipes, searchTerm]);

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
