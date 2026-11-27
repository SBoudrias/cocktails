import type { RecipeIngredient } from '@cocktails/data';
import { Calculator } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { List, ListRow, ListSubheader } from '#/components/ui/list';
import { buildFatWashSteps, getFatWashIngredients } from '#/modules/fatWash';
import { getFatWashCalculatorUrl } from '#/modules/url';

/**
 * Prep instructions for any fat-washed ingredient in a recipe, placed before
 * the cocktail's own instructions. Styled like the milk-clarification block:
 * the Calculator link sits right next to the section title, and the wash
 * technique is split into concise numbered steps that stay scannable on
 * mobile.
 */
export default function FatWashInstructions({
  ingredients,
}: {
  ingredients: readonly RecipeIngredient[];
}) {
  const baseId = useId();
  const fatWashes = getFatWashIngredients(ingredients);

  if (fatWashes.length === 0) {
    return null;
  }

  return (
    <>
      {fatWashes.map(({ ingredient, fatWash }, index) => {
        const headingId = `${baseId}-${index}`;
        const title =
          fatWashes.length === 1 ? 'Fat wash' : `Fat wash (${ingredient.name})`;
        const steps = buildFatWashSteps({
          fatType: fatWash.fat,
          fatPercentage: fatWash.percentage,
          spiritName: ingredient.name,
          method: fatWash.method,
          durationMinutes: fatWash.duration_minutes,
          temperatureC:
            fatWash.method === 'sous-vide' ? fatWash.temperature_c : undefined,
        });

        return (
          <section
            key={`${ingredient.slug}:${fatWash.fat}`}
            aria-labelledby={headingId}
            className="py-2"
          >
            <ListSubheader>
              <div className="flex items-center justify-between gap-2">
                <span id={headingId}>{title}</span>
                <Link
                  href={getFatWashCalculatorUrl(fatWash)}
                  className="inline-flex shrink-0 items-center gap-1 text-foreground no-underline"
                >
                  <Calculator
                    className="size-[13px] translate-y-[-1.5px]"
                    aria-hidden="true"
                  />
                  Calculator
                </Link>
              </div>
            </ListSubheader>
            <List aria-labelledby={headingId} className="surface py-0">
              {steps.map((step, stepIndex) => (
                <ListRow key={step}>
                  <span className="my-1 flex-1 text-left">
                    {stepIndex + 1}. {step}
                  </span>
                </ListRow>
              ))}
            </List>
          </section>
        );
      })}
    </>
  );
}
