import path from 'node:path';
import type { FileCheckInput } from '../../infra/types.ts';
import {
  getMilkClarificationIngredientSlugs,
  validateMilkClarification,
} from './milk-clarification.ts';

/**
 * Recipe-file pass: validates milk clarification against canonical names
 * (only when the file passed schema validation), then collects bar and
 * author attributions for the cross-file checks — bar name casings and
 * locations, author name usages — and fails on combined author names.
 */
export function checkAttributions(input: FileCheckInput): void {
  const { data, file, schemaPath, isValid, ctx, report } = input;

  if (schemaPath !== 'schemas/recipe.schema.json') return;

  if (isValid) {
    for (const message of validateMilkClarification(
      { ingredients: data.ingredients ?? [], techniques: data.techniques },
      ctx.canonicalNames,
      ctx.ingredientFolders,
    )) {
      report.fail(`${message} in ${path.basename(file)}`);
    }
    for (const ingredientSlug of getMilkClarificationIngredientSlugs(data)) {
      ctx.referencedIngredientSlugs.add(ingredientSlug);
    }
  }

  for (const attribution of data.attributions ?? []) {
    if (attribution.relation === 'bar') {
      const lowerName = attribution.source.toLowerCase();
      if (!ctx.barNameCasings.has(lowerName)) {
        ctx.barNameCasings.set(lowerName, new Map());
      }
      const casings = ctx.barNameCasings.get(lowerName)!;
      if (!casings.has(attribution.source)) {
        casings.set(attribution.source, []);
      }
      casings.get(attribution.source)!.push(file);

      ctx.barLocationUsages.push({
        name: attribution.source,
        location: attribution.location,
        filepath: file,
      });
    }

    // Check for combined author names (should be separate attributions)
    // We require 4+ words to avoid false positives on valid names like "Make and Drink".
    // This means rare cases like "Cher and Madonna" (3 words) won't be caught,
    // but most combined authors have at least one full name (e.g. "Cher and John Smith").
    if (
      attribution.relation === 'recipe author' ||
      attribution.relation === 'adapted by'
    ) {
      const hasConnector = / (and|&) /i.test(attribution.source);
      const wordCount = attribution.source.split(/\s+/).length;
      if (hasConnector && wordCount >= 4) {
        report.fail(
          `Combined authors in ${path.basename(file)}: "${attribution.source}". ` +
            `Split into separate attributions, one per person.`,
        );
      }

      if (!ctx.authorNameUsages.has(attribution.source)) {
        ctx.authorNameUsages.set(attribution.source, []);
      }
      ctx.authorNameUsages.get(attribution.source)!.push(file);
    }
  }
}
