'use client';

import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';
import { Recipe } from '@/types/Recipe';
import UnitSelector, { type Unit } from '@/components/Quantity/Selector';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getIngredientUrl } from '@/modules/url';
import { Stack, List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';
import { ingredientHasData } from '@/modules/hasData';

function IngredientLine({
  ingredient,
  preferredUnit,
}: {
  ingredient: Recipe['ingredients'][number];
  preferredUnit: Unit;
}) {
  let category;
  if (
    ingredient.type !== 'syrup' &&
    'categories' in ingredient &&
    ingredient.categories[0] != null
  ) {
    const label = ingredient.categories[0]!.name;
    category = <div className={styles.category}>{label}</div>;
  }

  let brix;
  if ('brix' in ingredient) {
    brix = <div className={styles.category}>{ingredient.brix} Brix</div>;
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />
      <div>
        <div className={styles.name}>
          {ingredient.preparation && ingredient.preparation + ' '}
          {ingredient.name}
        </div>
        {category}
        {brix}
      </div>
    </Stack>
  );
}

export default function IngredientList({
  ingredients,
}: {
  ingredients: Recipe['ingredients'];
}) {
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');

  return (
    <>
      <List>
        <ListSubheader>Ingredients</ListSubheader>
        <Paper square>
          {sortIngredients(ingredients).map((ingredient) => {
            if (ingredientHasData(ingredient)) {
              return (
                <Link key={ingredient.slug} href={getIngredientUrl(ingredient)}>
                  <ListItem divider secondaryAction={<ChevronRightIcon />}>
                    <ListItemText>
                      <IngredientLine
                        ingredient={ingredient}
                        preferredUnit={preferredUnit}
                      />
                    </ListItemText>
                  </ListItem>
                </Link>
              );
            }

            return (
              <ListItem key={ingredient.slug} divider>
                <ListItemText>
                  <IngredientLine ingredient={ingredient} preferredUnit={preferredUnit} />
                </ListItemText>
              </ListItem>
            );
          })}
        </Paper>
      </List>
      <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
    </>
  );
}
