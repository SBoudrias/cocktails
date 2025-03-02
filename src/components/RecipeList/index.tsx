import { useMemo } from 'react';
import Link from 'next/link';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { getRecipeUrl } from '@/modules/url';
import { Recipe } from '@/types/Recipe';

function RecipeLine({
  recipe,
  includeSourceName,
}: {
  recipe: Recipe;
  includeSourceName: boolean;
}) {
  return (
    <Link href={getRecipeUrl(recipe)}>
      <ListItem divider secondaryAction={<ChevronRight />}>
        <ListItemText
          primary={recipe.name}
          secondary={includeSourceName ? undefined : recipe.source.name}
        />
      </ListItem>
    </Link>
  );
}

export default function RecipeList({
  recipes,
  header,
  isNameUniqueFn,
}: {
  recipes: Recipe[];
  header?: React.ReactNode;
  isNameUniqueFn?: (name: string) => boolean;
}) {
  const nameIsUnique = useMemo(() => {
    if (isNameUniqueFn) return isNameUniqueFn;

    // Normalize names to lower case to avoid case sensitivity
    const store = Object.groupBy(recipes, (recipe) => recipe.name.toLowerCase());
    return (name: string) => store[name.toLowerCase()]?.length === 1;
  }, [isNameUniqueFn, recipes]);

  return (
    <List>
      {header && <ListSubheader>{header}</ListSubheader>}
      <Paper square>
        {recipes.map((recipe) => (
          <RecipeLine
            key={getRecipeUrl(recipe)}
            recipe={recipe}
            includeSourceName={nameIsUnique(recipe.name)}
          />
        ))}
      </Paper>
    </List>
  );
}
