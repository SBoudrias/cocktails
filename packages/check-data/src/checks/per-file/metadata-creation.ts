import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { ctx } from '../../context/data-context.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import type { FileCheckInput, Ingredient } from '../../infra/types.ts';
import { writeJSON } from '../../infra/write-json.ts';

/**
 * Creates stub metadata files for anything referenced but not yet tracked:
 * ingredients and categories used in recipe/ingredient files, and parent
 * categories on category files. Stubs fail the run so they get reviewed, and
 * the shared indexes are mutated so later files treat them as existing.
 *
 * Iterates the ingredient list captured before canonicalization, like the
 * original monolith pass: the sort step replaces `data.ingredients`, and the
 * creation messages keep their pre-sort order.
 */
export async function createMissingMetadata(
  input: FileCheckInput & {
    preCanonicalizationIngredients: Ingredient[];
  },
): Promise<void> {
  const { data, file, schemaPath, preCanonicalizationIngredients } = input;

  if (
    schemaPath === 'schemas/recipe.schema.json' ||
    schemaPath === 'schemas/ingredient.schema.json'
  ) {
    const ingredients = preCanonicalizationIngredients;
    const { categories = [] } = data;

    // Make sure all ingredients listed somewhere have a metadata file
    for (const ingredient of ingredients) {
      const ingredientSlug = slugify(ingredient.name);

      if (ingredient.type === 'category') {
        if (ctx.categorySlugs.has(ingredientSlug)) continue;

        const categoryPath = path.join(
          PACKAGE_ROOT,
          'data/categories',
          `${ingredientSlug}.json`,
        );

        await writeJSON(categoryPath, {
          $schema: path.relative(
            path.dirname(categoryPath),
            path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
          ),
          name: ingredient.name,
          categoryType: 'FIXME',
        });
        ctx.categorySlugs.add(ingredientSlug);
        report.fail(`Created ${categoryPath} - review and set categoryType`);
      } else {
        ctx.referencedIngredientSlugs.add(ingredientSlug);

        // Check if the ingredient exists in a different type folder
        const existingFolderType = ctx.ingredientFolders.get(ingredientSlug);
        if (existingFolderType === ingredient.type) continue;

        if (existingFolderType) {
          report.fail(
            `Ingredient "${ingredient.name}" in ${path.basename(file)} ` +
              `has type "${ingredient.type}" but the ingredient file is in folder "${existingFolderType}". ` +
              `Use type: "${existingFolderType}" in the recipe.`,
          );
          continue;
        }

        const ingredientPath = path.join(
          PACKAGE_ROOT,
          'data/ingredients',
          ingredient.type,
          `${ingredientSlug}.json`,
        );

        await writeJSON(ingredientPath, {
          $schema: path.relative(
            path.dirname(ingredientPath),
            path.resolve(PACKAGE_ROOT, 'schemas/ingredient.schema.json'),
          ),
          name: ingredient.name,
          type: ingredient.type,
        });
        ctx.ingredientFolders.set(ingredientSlug, ingredient.type);
        ctx.ingredientFiles.set(ingredientSlug, ingredientPath);
        report.fail(`Created ${ingredientPath} - review and add details if needed`);
      }
    }

    // Make sure all categories have a metadata file
    for (const category of categories) {
      const categorySlug = slugify(category);
      if (ctx.categorySlugs.has(categorySlug)) continue;

      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${categorySlug}.json`,
      );

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: data.type ?? 'FIXME',
      });
      ctx.categorySlugs.add(categorySlug);
      report.fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }

  // Make sure there's all parent categories have their metadata files
  if (schemaPath === 'schemas/category.schema.json') {
    for (const category of data.parents ?? []) {
      const categorySlug = slugify(category);
      if (ctx.categorySlugs.has(categorySlug)) continue;

      const categoryPath = path.join(
        PACKAGE_ROOT,
        'data/categories',
        `${categorySlug}.json`,
      );

      await writeJSON(categoryPath, {
        $schema: path.relative(
          path.dirname(categoryPath),
          path.resolve(PACKAGE_ROOT, 'schemas/category.schema.json'),
        ),
        name: category,
        categoryType: 'FIXME',
      });
      ctx.categorySlugs.add(categorySlug);
      report.fail(`Created ${categoryPath} - review and set categoryType`);
    }
  }
}
