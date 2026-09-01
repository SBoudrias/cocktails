'use client';

import type { Recipe, RecipeTechnique } from '@cocktails/data';
import { compareIngredients } from '@cocktails/ingredient-sorting';
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
import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import Quantity from '#/components/Quantity';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import ServingSelector from '#/components/ServingSelector';
import useLocalStorage from '#/hooks/useLocalStorage';
import { calculateScaleFactor, scaleQuantity } from '#/modules/scaling';
import { formatIngredientName, formatRecipeTechniqueName } from '#/modules/technique';
import { getMilkClarificationCalculatorUrl, getRecipeIngredientUrl } from '#/modules/url';
import styles from './style.module.css';

const EMPTY_TECHNIQUES: RecipeTechnique[] = [];

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
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />
      <div>
        <div className={styles.name}>{formatIngredientName(ingredient)}</div>
        {category}
        {brix}
      </div>
    </Stack>
  );
}

function TechniqueDetails({
  technique,
  preferredUnit,
}: {
  technique: RecipeTechnique;
  preferredUnit: Unit;
}) {
  return match(technique)
    .with({ technique: 'clarification', method: 'milk' }, (milkClarification) => (
      <Link
        href={getMilkClarificationCalculatorUrl(milkClarification.milk_type)}
        aria-label={`Milk clarification calculator for ${milkClarification.milk_type}`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
          <Quantity preferredUnit={preferredUnit} quantity={milkClarification.quantity} />
          <div className={styles.name}>{milkClarification.milk_type}</div>
        </Stack>
      </Link>
    ))
    .exhaustive();
}

export default function IngredientList({
  ingredients,
  techniques = EMPTY_TECHNIQUES,
  defaultServings = 1,
}: {
  ingredients: Recipe['ingredients'];
  techniques?: RecipeTechnique[];
  defaultServings?: number;
}) {
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');
  const [servings, setServings] = useState(defaultServings);
  const scaleFactor = calculateScaleFactor(defaultServings, servings);

  const scaledIngredients = useMemo(
    () =>
      scaleFactor === 1
        ? ingredients
        : ingredients.map((ingredient) => ({
            ...ingredient,
            quantity: scaleQuantity(ingredient.quantity, scaleFactor),
          })),
    [ingredients, scaleFactor],
  );
  const scaledTechniques = useMemo(
    () =>
      scaleFactor === 1
        ? techniques
        : techniques.map((recipeTechnique) => ({
            ...recipeTechnique,
            quantity: scaleQuantity(recipeTechnique.quantity, scaleFactor),
          })),
    [scaleFactor, techniques],
  );

  return (
    <>
      <List>
        <ListSubheader>Ingredients</ListSubheader>
        <Paper square>
          {scaledIngredients.toSorted(compareIngredients).map((ingredient) => {
            return (
              <Link key={ingredient.slug} href={getRecipeIngredientUrl(ingredient)}>
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
      {scaledTechniques.map((recipeTechnique) => {
        const headingId = `recipe-technique-${recipeTechnique.technique}-heading`;

        return (
          <Fragment key={recipeTechnique.technique}>
            <ListSubheader component="div" id={headingId}>
              {formatRecipeTechniqueName(recipeTechnique)}
            </ListSubheader>
            <List aria-labelledby={headingId}>
              <Paper square>
                <ListItem divider>
                  <ListItemText>
                    <TechniqueDetails
                      technique={recipeTechnique}
                      preferredUnit={preferredUnit}
                    />
                  </ListItemText>
                </ListItem>
              </Paper>
            </List>
          </Fragment>
        );
      })}
      <Toolbar sx={{ justifyContent: 'space-between', px: 1 }}>
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </Toolbar>
    </>
  );
}
