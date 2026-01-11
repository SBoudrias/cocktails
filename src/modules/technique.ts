import { match } from 'ts-pattern';
import type { RecipeIngredient, Technique } from '@/types/Ingredient';

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
  peeled: { countable: false, forms: ['peel', 'peel'] },
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
    .with({ technique: 'fat-wash' }, (t) => `${t.fat}–washed ${name}`)
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
