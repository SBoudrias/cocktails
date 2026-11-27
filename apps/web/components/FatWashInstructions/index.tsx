import type { RecipeIngredient } from '@cocktails/data';
import { Calculator } from 'lucide-react';
import Link from 'next/link';
import InstructionList from '#/components/InstructionList';
import { buildFatWashSteps, getFatWashIngredients } from '#/modules/fatWash';
import { getFatWashCalculatorUrl } from '#/modules/url';

/**
 * Prep instructions for any fat-washed ingredient in a recipe, placed before
 * the cocktail's own instructions. Reuses `InstructionList` with a trailing
 * Calculator link on the subheader.
 */
export default function FatWashInstructions({
  ingredients,
}: {
  ingredients: readonly RecipeIngredient[];
}) {
  const fatWashes = getFatWashIngredients(ingredients);

  if (fatWashes.length === 0) {
    return null;
  }

  return (
    <>
      {fatWashes.map(({ ingredient, fatWash }) => {
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
          <InstructionList
            key={`${ingredient.slug}:${fatWash.fat}`}
            title={title}
            instructions={steps}
            action={
              <Link
                href={getFatWashCalculatorUrl(fatWash)}
                className="inline-flex shrink-0 items-center gap-1.5 text-foreground no-underline"
              >
                <Calculator className="size-3.5 shrink-0" aria-hidden="true" />
                Calculator
              </Link>
            }
          />
        );
      })}
    </>
  );
}
