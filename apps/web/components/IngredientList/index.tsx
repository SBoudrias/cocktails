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
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import Quantity from '#/components/Quantity';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import ServingSelector from '#/components/ServingSelector';
import useLocalStorage from '#/hooks/useLocalStorage';
import { calculateScaleFactor, scaleQuantity } from '#/modules/scaling';
import { formatIngredientName } from '#/modules/technique';
import { getMilkClarificationCalculatorUrl, getRecipeIngredientUrl } from '#/modules/url';
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
      <Stack spacing={0.5}>
        <Link
          href={getMilkClarificationCalculatorUrl(milkClarification.milk_type)}
          aria-label={`Milk clarification calculator for ${milkClarification.milk_type}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Typography component="span" variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Milk clarification
          </Typography>
        </Link>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
          <Quantity
            preferredUnit={preferredUnit}
            quantity={milkClarification.milk_quantity}
          />
          <div className={styles.name}>{milkClarification.milk_type}</div>
        </Stack>
      </Stack>
    ))
    .exhaustive();
}

export default function IngredientList({
  ingredients,
  technique,
  defaultServings = 1,
}: {
  ingredients: Recipe['ingredients'];
  technique?: Recipe['technique'];
  defaultServings?: number;
}) {
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');
  const [servings, setServings] = useState(defaultServings);
  const scaleFactor = calculateScaleFactor(defaultServings, servings);

  // Scale all ingredients at the list level
  const scaledIngredients = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        ...ingredient,
        quantity:
          scaleFactor !== 1
            ? scaleQuantity(ingredient.quantity, scaleFactor)
            : ingredient.quantity,
      })),
    [ingredients, scaleFactor],
  );
  const scaledTechniques = useMemo(
    () =>
      (technique == null ? [] : Array.isArray(technique) ? technique : [technique]).map(
        (recipeTechnique) => ({
          ...recipeTechnique,
          milk_quantity:
            scaleFactor !== 1
              ? scaleQuantity(recipeTechnique.milk_quantity, scaleFactor)
              : recipeTechnique.milk_quantity,
        }),
      ),
    [scaleFactor, technique],
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
      {scaledTechniques.length > 0 && (
        <List aria-labelledby="recipe-techniques-heading">
          <ListSubheader id="recipe-techniques-heading">Techniques</ListSubheader>
          <Paper square>
            {scaledTechniques.map((recipeTechnique, index) => (
              <ListItem
                divider
                key={`${recipeTechnique.technique}-${recipeTechnique.milk_type}-${index}`}
              >
                <ListItemText>
                  <TechniqueDetails
                    technique={recipeTechnique}
                    preferredUnit={preferredUnit}
                  />
                </ListItemText>
              </ListItem>
            ))}
          </Paper>
        </List>
      )}
      <Toolbar sx={{ justifyContent: 'space-between', px: 1 }}>
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </Toolbar>
    </>
  );
}
