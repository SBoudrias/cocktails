'use client';

import type { Recipe, RecipeTechnique } from '@cocktails/data';
import { compareIngredients } from '@cocktails/ingredient-sorting';
import { Anchor, Group } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { List, ListRow, ListSubheader } from '#/components/AppList';
import Quantity from '#/components/Quantity';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import ServingSelector from '#/components/ServingSelector';
import useLocalStorage from '#/hooks/useLocalStorage';
import { getMilkClarificationContext } from '#/modules/milkClarification';
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
    <Group gap={4} align="baseline" wrap="nowrap">
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />{' '}
      <div>
        <div className={styles.name}>
          {formatIngredientName(ingredient)}
          {ingredient.optional && <span className={styles.optional}> (optional)</span>}
        </div>
        {category}
        {brix}
      </div>
    </Group>
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
      <Group gap={4} align="baseline" wrap="nowrap">
        <Quantity preferredUnit={preferredUnit} quantity={milkClarification.quantity} />{' '}
        <div className={styles.name}>{milkClarification.milk_type}</div>
      </Group>
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
      <section>
        <ListSubheader id="ingredients-subheader">Ingredients</ListSubheader>
        <List aria-labelledby="ingredients-subheader">
          {scaledIngredients.toSorted(compareIngredients).map((ingredient) => (
            <ListRow key={ingredient.slug} href={getRecipeIngredientUrl(ingredient)}>
              <IngredientLine ingredient={ingredient} preferredUnit={preferredUnit} />
            </ListRow>
          ))}
        </List>
      </section>
      {scaledTechniques.map((recipeTechnique) => {
        const headingId = `recipe-technique-${recipeTechnique.technique}-heading`;
        const calculatorUrl = match(recipeTechnique)
          .with({ technique: 'clarification', method: 'milk' }, (milkClarification) =>
            getMilkClarificationCalculatorUrl({
              milkType: milkClarification.milk_type,
              ...getMilkClarificationContext({
                milkClarification,
                ingredients: scaledIngredients,
                preferredUnit,
              }),
            }),
          )
          .exhaustive();

        return (
          <Fragment key={recipeTechnique.technique}>
            <ListSubheader>
              <Group justify="space-between">
                <span id={headingId}>{formatRecipeTechniqueName(recipeTechnique)}</span>
                <Anchor
                  component={Link}
                  href={calculatorUrl}
                  underline="never"
                  c="white"
                  size="sm"
                  inline
                >
                  <Group gap={4} component="span">
                    <IconCalculator size={14} />
                    Calculate milk for a batch
                  </Group>
                </Anchor>
              </Group>
            </ListSubheader>
            <List aria-labelledby={headingId}>
              <ListRow>
                <TechniqueDetails
                  technique={recipeTechnique}
                  preferredUnit={preferredUnit}
                />
              </ListRow>
            </List>
          </Fragment>
        );
      })}
      <Group justify="space-between" align="flex-end" px="xs" py="sm">
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </Group>
    </>
  );
}
