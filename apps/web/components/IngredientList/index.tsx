'use client';

import type { Recipe, RecipeTechnique } from '@cocktails/data';
import { compareIngredients } from '@cocktails/ingredient-sorting';
import { Calculator, ChevronRight } from 'lucide-react';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import Quantity from '#/components/Quantity';
import UnitSelector, { type Unit } from '#/components/Quantity/Selector';
import { List, ListRow, ListSubheader } from '#/components/ui/list';
import useLocalStorage from '#/hooks/useLocalStorage';
import { getMilkClarificationContext } from '#/modules/milkClarification';
import { calculateScaleFactor, scaleQuantity } from '#/modules/scaling';
import { formatIngredientName, formatRecipeTechniqueName } from '#/modules/technique';
import { getMilkClarificationCalculatorUrl, getRecipeIngredientUrl } from '#/modules/url';
import ServingSelector from './ServingSelector';
import styles from './style.module.css';

const EMPTY_TECHNIQUES: RecipeTechnique[] = [];

// The ingredient row: a divider-bottomed row (8px vertical padding, 16px
// left, the 48px trailing zone for the chevron).
function IngredientRow<RouteType>({
  href,
  children,
}: {
  href: LinkProps<RouteType>['href'];
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex w-full items-center border-b py-2 pr-12 pl-4 text-base capitalize transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="my-1 flex-1 text-left">{children}</span>
        <ChevronRight className="size-6 shrink-0 text-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}

// The technique row: the plain ListRow without the link, chevron or
// trailing zone.
function TechniqueRow({ children }: { children: React.ReactNode }) {
  return (
    <ListRow className="pr-0 capitalize">
      <span className="my-1 flex-1 text-left">{children}</span>
    </ListRow>
  );
}

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
    <div className="flex flex-row items-baseline gap-1">
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />{' '}
      <div>
        <div className={styles.name}>
          {formatIngredientName(ingredient)}
          {ingredient.optional && <span className={styles.optional}> (optional)</span>}
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
        <div className={styles.name}>{milkClarification.milk_type}</div>
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
      <List aria-label="Ingredients" className="bg-transparent px-0">
        <ListSubheader>Ingredients</ListSubheader>
        <div className="surface">
          {scaledIngredients.toSorted(compareIngredients).map((ingredient) => {
            return (
              <IngredientRow
                key={ingredient.slug}
                href={getRecipeIngredientUrl(ingredient)}
              >
                <IngredientLine ingredient={ingredient} preferredUnit={preferredUnit} />
              </IngredientRow>
            );
          })}
        </div>
      </List>
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
              <div className="flex items-center justify-between">
                <span id={headingId}>{formatRecipeTechniqueName(recipeTechnique)}</span>
                <Link
                  href={calculatorUrl}
                  className="inline-flex items-center gap-1 text-foreground no-underline"
                >
                  {/* The Calculate glyph sits low in its viewBox; lift it into
                      the text cap band */}
                  <Calculator
                    className="size-[13px] translate-y-[-1.5px]"
                    aria-hidden="true"
                  />
                  Calculate milk for a batch
                </Link>
              </div>
            </ListSubheader>
            <List aria-labelledby={headingId} className="bg-transparent px-0">
              <div className="surface">
                <TechniqueRow>
                  <TechniqueDetails
                    technique={recipeTechnique}
                    preferredUnit={preferredUnit}
                  />
                </TechniqueRow>
              </div>
            </List>
          </Fragment>
        );
      })}
      {/* The toolbar row's responsive metrics: 8px padding and 56px
          min-height, doubling to 24px/64px from 600px up. */}
      <div className="flex min-h-14 items-center justify-between px-2 min-[600px]:min-h-16 min-[600px]:px-6">
        <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
        <ServingSelector servings={servings} onChange={setServings} />
      </div>
    </>
  );
}
