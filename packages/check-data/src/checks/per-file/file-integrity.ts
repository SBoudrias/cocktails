import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { logger } from '../../cli-util.ts';
import { ctx } from '../../context/data-context.ts';
import { PACKAGE_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import { ajv } from '../../infra/schemas.ts';
import type { DataWithSchema } from '../../infra/types.ts';
import { writeJSON } from '../../infra/write-json.ts';

/**
 * Schema, filename and folder integrity: validates the file against its
 * schema, auto-fixes the `$schema` path, renames files not matching their
 * data's name, moves ingredient files into their type's folder, and fails on
 * ingredient files duplicating a category slug.
 *
 * Returns false when the file is unprocessable (invalid JSON, missing or
 * unknown schema) so the caller can skip the remaining checks.
 */
export async function checkFileIntegrity(
  sourceFile: string,
  data: DataWithSchema,
): Promise<{ schemaPath: string; isValid: boolean | Promise<unknown> } | null> {
  if (!data.$schema) {
    report.fail(`$schema not defined in ${sourceFile}`);
    return null;
  }

  const schemaBasename = path.basename(data.$schema);
  const validate = ajv.getSchema(schemaBasename);

  if (!validate) {
    report.fail(`Schema not found for ${sourceFile} at ${data.$schema ?? 'undefined'}`);
    return null;
  }

  const expectedSchemaPath = path.relative(
    path.dirname(sourceFile),
    path.resolve(PACKAGE_ROOT, 'schemas', schemaBasename),
  );
  if (data.$schema !== expectedSchemaPath) {
    logger.change(
      `Fixing $schema in ${path.basename(sourceFile)}: "${data.$schema}" → "${expectedSchemaPath}"`,
    );
    data.$schema = expectedSchemaPath;
    await writeJSON(sourceFile, data);
  }

  const schemaPath = `schemas/${schemaBasename}`;

  const isValid = validate(data);
  if (!isValid) {
    report.fail(`Validation failed for ${sourceFile}`);
    console.error(validate.errors);
  }

  // Enforce filename should be the name of the data. Bar entity files are the
  // exception: their slug is the name *and* location, matching the list pages.
  const basename = path.basename(sourceFile, '.json');
  if (basename !== '_source' && schemaBasename !== 'bar.schema.json') {
    const expectedName = slugify(data.name);
    if (basename !== expectedName) {
      const newPath = path.join(path.dirname(sourceFile), `${expectedName}.json`);
      logger.change(`Renaming ${path.basename(sourceFile)} to ${path.basename(newPath)}`);
      await fs.rename(sourceFile, newPath);
    }
  }

  // Ensure no ingredient file has the same name as a category
  if (schemaPath === 'schemas/ingredient.schema.json') {
    const ingredientSlug = slugify(data.name);
    if (ctx.categorySlugs.has(ingredientSlug)) {
      report.fail(
        `Ingredient "${data.name}" duplicates category "${ingredientSlug}". ` +
          `Remove the ingredient file and use type: "category" in recipes instead.`,
      );
    }

    // Ensure the ingredient's type matches its folder — auto-move if not
    const folderType = path.basename(path.dirname(sourceFile));
    if (data.type && data.type !== folderType) {
      const correctPath = path.join(
        path.dirname(path.dirname(sourceFile)),
        data.type,
        path.basename(sourceFile),
      );
      logger.change(
        `Moving "${path.basename(sourceFile)}" from "${folderType}/" to "${data.type}/"`,
      );
      await fs.mkdir(path.dirname(correctPath), { recursive: true });
      await fs.rename(sourceFile, correctPath);
      // Update ingredientFolders so cross-folder checks use the new location
      ctx.ingredientFolders.set(slugify(data.name), data.type);
    }
  }

  return { schemaPath, isValid };
}
