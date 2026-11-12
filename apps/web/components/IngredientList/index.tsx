'use client';

import type { Recipe, RecipeTechnique } from '@cocktails/data';
import { compareIngredients } from '@cocktails/ingredient-sorting';
import { Calculator } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import Quantity from '#/components/Quantity';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import ServingSelector from '#/components/ServingSelector';
import { List, ListRow, ListSubheader } from '#/components/ui/list';
import useLocalStorage from '#/hooks/useLocalStorage';
import { getMilkClarificationContext } from '#/modules/milkClarification';
import { calculateScaleFactor, scaleQuantity } from '#/modules/scaling';
import { formatIngredientName, formatRecipeTechniqueName } from '#/modules/technique';
import { getMilkClarificationCalculatorUrl, getRecipeIngredientUrl } from '#/modules/url';

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
    category = (
      <div className="text-[0.8em] text-muted-foreground capitalize">{label}</div>
    );
  }

  let brix;
  if ('brix' in ingredient) {
    brix = (
      <div className="text-[0.8em] text-muted-foreground capitalize">
        {ingredient.brix} Brix
      </div>
    );
  }

  return (
    <div className="flex flex-row items-baseline gap-1">
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />{' '}
      <div>
        <div className="capitalize">
          {formatIngredientName(ingredient)}
          {ingredient.optional && (
            <span className="text-[0.8em] text-muted-foreground normal-case">
              {' '}
              (optional)
            </span>
          )}
        </div>
        {category}
        {brix}
      </div>
    </div>
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
      <div className="flex flex-row items-baseline gap-1">
        <Quantity preferredUnit={preferredUnit} quantity={milkClarification.quantity} />{' '}
        <div className="capitalize">{milkClarification.milk_type}</div>
      </div>
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
      <section className="py-2">
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
            <ListSubheader className="flex items-center justify-between">
              <span id={headingId}>{formatRecipeTechniqueName(recipeTechnique)}</span>
              <Link
                href={calculatorUrl}
                className="inline-flex items-center gap-1 text-white hover:underline"
              >
                <Calculator className="size-3.5" />
                Calculate milk for a batch
              </Link>
            </ListSubheader>
            {/* MUI's List padding: 8px above and below the rows */}
            <div className="py-2">
              <List aria-labelledby={headingId}>
                <ListRow>
                  <TechniqueDetails
                    technique={recipeTechnique}
                    preferredUnit={preferredUnit}
                  />
                </ListRow>
              </List>
            </div>
          </Fragment>
        );
      })}
      <div className="flex min-h-14 items-center justify-between px-2 min-[600px]:min-h-16">
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </div>
    </>
  );
}
