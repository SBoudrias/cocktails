import { useMemo } from 'react';
import Link from 'next/link';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { getRecipeUrl } from '@/modules/url';
import type { Recipe } from '@/types/Recipe';
import { match } from 'ts-pattern';

const ATTRIBUTION_PRIORITY = ['adapted by', 'recipe author', 'book', 'bar'];
function RecipeLine({
  recipe,
  includeSourceName,
}: {
  recipe: Recipe;
  includeSourceName: boolean;
}) {
  let sourceLine;
  if (includeSourceName) {
    let attribution = null;
    for (const attr of recipe.attributions) {
      const currentPriority = ATTRIBUTION_PRIORITY.indexOf(attr.relation);
      if (currentPriority === -1) continue;

      if (!attribution) {
        attribution = attr;
      } else {
        const savedPriority = ATTRIBUTION_PRIORITY.indexOf(attribution.relation);
        if (currentPriority < savedPriority) {
          attribution = attr;
        }
      }
    }

    const bookName = recipe.source.type === 'book' ? recipe.source.name : undefined;

    sourceLine = match(attribution)
      .with(null, () => recipe.source.name)
      .with({ relation: 'adapted by' }, ({ source }) =>
        [source, bookName].filter(Boolean).join(' | '),
      )
      .with({ relation: 'recipe author' }, ({ source }) =>
        [source, bookName].filter(Boolean).join(' | '),
      )
      .with({ relation: 'bar' }, ({ source }) => bookName || `served at ${source}`)
      .with({ relation: 'book' }, ({ source }) => source)
      .exhaustive();
  }

  return (
    <Link href={getRecipeUrl(recipe)}>
      <ListItem divider secondaryAction={<ChevronRight />}>
        <ListItemText
          primary={recipe.name}
          secondary={includeSourceName ? sourceLine : undefined}
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

  const headerId = header ? `group-header-${header}` : undefined;

  return (
    <List role={header ? 'group' : undefined} aria-labelledby={headerId}>
      {header && <ListSubheader id={headerId}>{header}</ListSubheader>}
      <Paper square>
        {recipes.map((recipe) => (
          <RecipeLine
            key={getRecipeUrl(recipe)}
            recipe={recipe}
            includeSourceName={!nameIsUnique(recipe.name)}
          />
        ))}
      </Paper>
    </List>
  );
}
