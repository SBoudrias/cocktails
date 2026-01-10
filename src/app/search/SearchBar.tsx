'use client';

import { Recipe } from '@/types/Recipe';
import { useMemo } from 'react';
import { getRecipeSearchText } from '@/modules/searchText';
import {
  AppBar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { useQueryState } from 'nuqs';
import RecipeList from '@/components/RecipeList';
import SearchInput from '@/components/SearchInput';
import SearchableList from '@/components/SearchableList';

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

  const emptyState = (
    <Card sx={{ m: 2 }}>
      <CardHeader title="No results found" />
      <CardContent>
        <Typography variant="body2">
          No recipes or ingredients matched the search term &quot;{searchTerm}&quot;
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      <AppBar>
        <SearchBar onChange={setSearchTerm} value={searchTerm ?? ''} />
      </AppBar>
      <Toolbar />
      <SearchableList
        items={recipes}
        getSearchText={getRecipeSearchText}
        renderItem={(items, header, headerId) => (
          <RecipeList
            recipes={items}
            header={header}
            headerId={headerId}
            isNameUniqueFn={nameIsUnique}
          />
        )}
        searchTerm={searchTerm}
        emptyState={emptyState}
      />
    </>
  );
}
