'use client';

import { Recipe } from '@/types/Recipe';
import { useMemo, useState } from 'react';
import uFuzzy from '@leeoniya/ufuzzy';
import { getRecipeUrl } from '@/modules/url';
import {
  AppBar,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputBase,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
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
  onChange: (value: string) => void;
}) {
  const [hasFocus, setHasFocus] = useState(false);

  return (
    <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search…"
          inputProps={{ 'aria-label': 'search' }}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
        />
      </Search>
      {(hasFocus || value) && <Button onClick={() => onChange('')}>Cancel</Button>}
    </Stack>
  );
}

function RecipeLine({ recipe, isUnique }: { recipe: Recipe; isUnique: boolean }) {
  return (
    <Link href={getRecipeUrl(recipe)}>
      <ListItem divider secondaryAction={<ChevronRightIcon />}>
        <ListItemText
          primary={recipe.name}
          secondary={isUnique ? undefined : recipe.source.name}
        />
      </ListItem>
    </Link>
  );
}

export default function SearchPage({ recipes }: { recipes: Recipe[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const nameIsUnique = useMemo(() => {
    // Normalize names to lower case to avoid case sensitivity
    const store = Object.groupBy(recipes, (recipe) => recipe.name.toLowerCase());
    return (name: string) => store[name.toLowerCase()]?.length === 1;
  }, [recipes]);

  const haystack = useMemo(
    () =>
      recipes.map((recipe) => {
        return `${recipe.name} ${recipe.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.categories?.join(' ')}`).join(' ')}`.toLowerCase();
      }),
    [recipes],
  );

  const searchMatches = useMemo(() => {
    if (searchTerm.trim().length === 0) return [];

    const uf = new uFuzzy();
    const [matchIndexes] = uf.search(haystack, searchTerm.toLowerCase(), 0, 1e3);

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
    content = (
      <List>
        <Paper square>
          {searchMatches.map((recipe) => (
            <RecipeLine
              key={getRecipeUrl(recipe)}
              recipe={recipe}
              isUnique={nameIsUnique(recipe.name)}
            />
          ))}
        </Paper>
      </List>
    );
  } else if (searchTerm.trim().length === 0) {
    const firstLetterRegExp = /^(the |a )?([a-z])/i;
    const groups = Object.entries(
      Object.groupBy(recipes, (recipe) => {
        const matches = recipe.name.match(firstLetterRegExp) ?? [];
        return matches[2]?.toUpperCase() ?? '#';
      }),
    ).sort(([a], [b]) => a.localeCompare(b));

    content = (
      <List>
        {groups.map(([letter, recipes]) => {
          if (!recipes) return;

          return (
            <li key={letter}>
              <ul>
                <ListSubheader>{letter}</ListSubheader>
                <Paper square>
                  {recipes.map((recipe) => (
                    <RecipeLine
                      key={getRecipeUrl(recipe)}
                      recipe={recipe}
                      isUnique={nameIsUnique(recipe.name)}
                    />
                  ))}
                </Paper>
              </ul>
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
        <Toolbar>
          <SearchBar onChange={setSearchTerm} value={searchTerm} />
        </Toolbar>
      </AppBar>
      <Toolbar />
      {content}
    </>
  );
}
