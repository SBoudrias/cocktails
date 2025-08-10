'use client';

import { useState } from 'react';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';
import { Recipe } from '@/types/Recipe';
import UnitSelector, { type Unit } from '@/components/Quantity/Selector';
import ServingSelector from '@/components/ServingSelector';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getIngredientUrl } from '@/modules/url';
import { formatIngredientName } from '@/modules/technique';
import { scaleQuantity, calculateScaleFactor } from '@/modules/scaling';
import {
  Stack,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Toolbar,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';

function IngredientLine({
  ingredient,
  preferredUnit,
  scaleFactor,
}: {
  ingredient: Recipe['ingredients'][number];
  preferredUnit: Unit;
  scaleFactor: number;
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

  // Scale the quantity if scale factor is not 1
  const displayQuantity =
    scaleFactor !== 1
      ? scaleQuantity(ingredient.quantity, scaleFactor)
      : ingredient.quantity;

  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <Quantity preferredUnit={preferredUnit} quantity={displayQuantity} />
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
  servings,
  defaultServings,
}: {
  ingredients: Recipe['ingredients'];
  servings?: number;
  defaultServings?: number;
}) {
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');
  const recipeDefaultServings = defaultServings || 1;
  const [currentServings, setCurrentServings] = useState(
    servings || recipeDefaultServings,
  );

  const scaleFactor = calculateScaleFactor(recipeDefaultServings, currentServings);

  return (
    <>
      <List>
        <ListSubheader>Ingredients</ListSubheader>
        <Paper square>
          {sortIngredients(ingredients).map((ingredient) => {
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
                      scaleFactor={scaleFactor}
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
        <ServingSelector
          currentServings={currentServings}
          defaultServings={recipeDefaultServings}
          onChange={setCurrentServings}
        />
      </Toolbar>
    </>
  );
}
