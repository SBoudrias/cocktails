'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Stack,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Toolbar,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import type { Recipe } from '@/types/Recipe';
import Quantity from '@/components/Quantity';
import UnitSelector, { type Unit } from '@/components/Quantity/Selector';
import ServingSelector from '@/components/ServingSelector';
import useLocalStorage from '@/hooks/useLocalStorage';
import { scaleQuantity, calculateScaleFactor } from '@/modules/scaling';
import { formatIngredientName } from '@/modules/technique';
import { getIngredientUrl } from '@/modules/url';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';

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
        <div className={styles.name}>{formatIngredientName(ingredient)}</div>
        {category}
        {brix}
      </div>
    </Stack>
  );
}

export default function IngredientList({
  ingredients,
  defaultServings = 1,
}: {
  ingredients: Recipe['ingredients'];
  defaultServings?: number;
}) {
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');
  const [servings, setServings] = useState(defaultServings);
  const scaleFactor = calculateScaleFactor(defaultServings, servings);

  // Scale all ingredients at the list level
  const scaledIngredients = ingredients.map((ingredient) => ({
    ...ingredient,
    quantity:
      scaleFactor !== 1
        ? scaleQuantity(ingredient.quantity, scaleFactor)
        : ingredient.quantity,
  }));

  return (
    <>
      <List>
        <ListSubheader>Ingredients</ListSubheader>
        <Paper square>
          {sortIngredients(scaledIngredients).map((ingredient) => {
            let href = getIngredientUrl(ingredient);
            if (ingredient.type === 'juice') {
              href += `?${new URLSearchParams({ juiceAmount: String(ingredient.quantity.amount) })}`;
            }

            return (
              <Link key={ingredient.slug} href={href}>
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
          })}
        </Paper>
      </List>
      <Toolbar sx={{ justifyContent: 'space-between', px: 1 }}>
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </Toolbar>
    </>
  );
}
