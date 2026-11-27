import type { RecipeIngredient, RecipeTechnique, Technique } from '@cocktails/data';
import { match } from 'ts-pattern';

const cutTypeNames = {
  chunked: { countable: true, forms: ['chunk', 'chunks'] },
  cubed: { countable: true, forms: ['cube', 'cubes'] },
  sliced: { countable: true, forms: ['slice', 'slices'] },
  sectioned: { countable: true, forms: ['section', 'sections'] },
  disc: { countable: false, forms: ['disc', 'discs'] },
  diced: { countable: false, forms: ['diced', 'diced'] },
  julienned: { countable: false, forms: ['julienned', 'julienned'] },
  wheeled: { countable: true, forms: ['wheel', 'wheels'] },
  wedged: { countable: true, forms: ['wedge', 'wedges'] },
  peeled: { countable: false, forms: ['peel', 'peels'] },
  zested: { countable: false, forms: ['zest', 'zest'] },
};

/**
 * Converts a technique object to a human-readable string for display
 */
function formatSingleTechnique(
  technique: Technique,
  name: string,
  ingredient: RecipeIngredient,
): string {
  return match(technique)
    .with({ technique: 'infusion' }, (t) =>
      [t.method, `${t.agent}–infused`, name].filter(Boolean).join(' '),
    )
    .with({ technique: 'fat-wash' }, (t) =>
      [t.method === 'sous-vide' ? 'sous-vide' : undefined, `${t.fat}–washed`, name]
        .filter(Boolean)
        .join(' '),
    )
    .with({ technique: 'milk-wash' }, (t) => `${t.milk_type} milk-washed ${name}`)
    .with({ technique: 'clarification', method: 'milk' }, (t) =>
      t.milk_type ? `${t.milk_type} milk-clarified ${name}` : `milk-clarified ${name}`,
    )
    .with({ technique: 'clarification' }, () => `clarified ${name}`)
    .with({ technique: 'temperature' }, (t) => `${t.method} ${name}`)
    .with({ technique: 'muddled' }, () => `muddled ${name}`)
    .with({ technique: 'cut' }, (t) => {
      const { amount } = ingredient.quantity;
      const cutInfo = cutTypeNames[t.type];
      const cutForm = amount === 1 ? cutInfo.forms[0] : cutInfo.forms[1];

      if (cutInfo.countable) {
        // Countable cuts: "1-inch pineapple cubes", "cucumber slice"
        return [t.size, name, cutForm].filter(Boolean).join(' ');
      } else {
        // Special cases: peel and zest should be "orange peel", "lemon zest"
        if (t.type === 'peeled' || t.type === 'zested') {
          return [name, cutForm].join(' ');
        }
        // Other non-countable cuts: "julienned carrots", "diced onion"
        return [cutForm, name].join(' ');
      }
    })
    .with({ technique: 'maturity' }, (t) => `${t.state} ${name}`)
    .with({ technique: 'application', method: 'float' }, () => `Float of ${name}`)
    .with({ technique: 'application', method: 'rinse' }, () => `Rinse with ${name}`)
    .with({ technique: 'application', method: 'top' }, () => `Top with ${name}`)
    .with({ technique: 'acid-adjustment' }, () => `acid-adjusted ${name}`)
    .with({ technique: 'gelification' }, () => `gelified ${name}`)
    .exhaustive();
}

export function formatIngredientName(ingredient: RecipeIngredient): string {
  const { name } = ingredient;

  if (!ingredient.technique) {
    return name;
  }

  // Handle array of techniques
  if (Array.isArray(ingredient.technique)) {
    // Apply techniques in sequence, starting with the base name
    return ingredient.technique.reduce((currentName, technique) => {
      return formatSingleTechnique(technique, currentName, ingredient);
    }, name);
  }

  // Handle single technique (backward compatibility)
  return formatSingleTechnique(ingredient.technique, name, ingredient);
}

const specUnitNames: Partial<Record<RecipeIngredient['quantity']['unit'], string>> = {
  gram: 'g',
};

/** A spec quantity as a terse string — "1.5 oz", "40 g", "2 tbsp" — with an
 * optional noun naming what the amount is ("1 vanilla pod"). */
function formatSpecQuantity(
  quantity: RecipeIngredient['quantity'],
  noun?: string,
): string {
  const amount = Number.isInteger(quantity.amount)
    ? quantity.amount
    : Math.round(quantity.amount * 100) / 100;
  const unit =
    quantity.unit === 'unit'
      ? undefined
      : (specUnitNames[quantity.unit] ?? quantity.unit);

  return [amount, unit, noun].filter(Boolean).join(' ');
}

/** The preparation details a technique carries beyond its name marker —
 * the wash percentage or infusion batch ratio — as one muted line per
 * technique. The full process stays in the Fat wash section and calculator. */
function formatSingleTechniqueSpec(technique: Technique): string | undefined {
  const spec = match(technique)
    .with({ technique: 'fat-wash' }, (t) =>
      t.percentage != null ? `${t.percentage}% fat` : undefined,
    )
    .with({ technique: 'infusion' }, (t) => {
      const agent = t.agent_quantity
        ? formatSpecQuantity(t.agent_quantity, t.agent)
        : undefined;

      return agent && t.spirit_quantity
        ? `${agent} per ${formatSpecQuantity(t.spirit_quantity)}`
        : undefined;
    })
    .otherwise(() => '');

  return spec === '' ? undefined : spec;
}

/**
 * The technique specs an ingredient carries — fat-wash percentages and
 * infusion batch ratios — as one string per technique, for the muted
 * sub-lines under the ingredient name on a recipe page. Techniques that only
 * rename the ingredient (cuts, temperatures, applications…) carry no spec.
 */
export function formatIngredientSpecs(ingredient: RecipeIngredient): string[] {
  if (ingredient.technique == null) return [];

  const techniques = Array.isArray(ingredient.technique)
    ? ingredient.technique
    : [ingredient.technique];

  return techniques
    .map(formatSingleTechniqueSpec)
    .filter((spec): spec is string => spec != null);
}

export function formatRecipeTechnique(technique: RecipeTechnique): string {
  return match(technique)
    .with(
      { technique: 'clarification', method: 'milk' },
      ({ milk_type: milkType }) => `${milkType} clarified`,
    )
    .exhaustive();
}

export function formatRecipeTechniqueName(technique: RecipeTechnique): string {
  return match(technique)
    .with({ technique: 'clarification', method: 'milk' }, () => 'Milk clarification')
    .exhaustive();
}
