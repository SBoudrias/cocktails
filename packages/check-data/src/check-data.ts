#!/usr/bin/env -S node --no-warnings

import fs from 'node:fs/promises';
import path from 'node:path';
import { checkAttributions } from './attributions.ts';
import { checkAuthorSources } from './author-sources.ts';
import { reportBarCasing } from './bar-casing.ts';
import { reportBarLocations } from './bar-locations-check.ts';
import { reportBookChapters } from './book-chapters.ts';
import { logger } from './cli-util.ts';
import { loadDataContext } from './data-context.ts';
import { checkFileIntegrity } from './file-integrity.ts';
import { findFloatingIngredients } from './floating-ingredients.ts';
import { canonicalizeFile } from './ingredient-canonicalization.ts';
import { applyKeyOrdering } from './key-order.ts';
import { createMissingMetadata } from './metadata-creation.ts';
import { PACKAGE_ROOT } from './paths.ts';
import { reportRedundantCategories } from './redundant-categories.ts';
import { checkRefs } from './refs.ts';
import { createReport, type Report } from './report.ts';
import { loadSchemas } from './schemas.ts';
import { reportSimilarNames } from './similar-names.ts';
import type { DataWithSchema, Ingredient } from './types.ts';
import { reportUntrackedChannels } from './untracked-channels.ts';
import { createWriteJSON } from './write-json.ts';

const startTime = performance.now();

// Schema formatter - auto-infers key ordering from registered schemas
const { report, getExitCode } = createReport();
const fail: Report['fail'] = report.fail;

const { ajv, formatter } = await loadSchemas();
const writeJSON = createWriteJSON({ formatter, report });

const ctx = await loadDataContext({ writeJSON, report });
const { ingredients, referencedIngredientSlugs } = ctx;

logger.header('🔍 Validating data files...');
const dataGlob = path.join(PACKAGE_ROOT, 'data/**/*.json');
for await (const sourceFile of fs.glob(dataGlob)) {
  let data: DataWithSchema;
  try {
    data = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
  } catch (error) {
    fail(`Invalid JSON in ${sourceFile} ${(error as Error).message}`);
    continue;
  }

  const integrity = await checkFileIntegrity({
    sourceFile,
    data,
    ajv,
    ctx,
    report,
    writeJSON,
  });
  if (!integrity) continue;
  const { schemaPath, isValid } = integrity;
  const fileInput = {
    data,
    file: sourceFile,
    schemaPath,
    isValid,
    ctx,
    report,
    writeJSON,
  };

  checkRefs(fileInput);
  checkAuthorSources(fileInput);
  checkAttributions(fileInput);

  const preCanonicalizationIngredients: Ingredient[] = data.ingredients ?? [];
  await canonicalizeFile(fileInput);
  await createMissingMetadata({
    ...fileInput,
    preCanonicalizationIngredients,
  });

  // Apply key ordering to all data files (silently)
  await applyKeyOrdering({ data, file: sourceFile, formatter, writeJSON });
}
logger.footer('Done!');

logger.header('🛟 Checking for floating ingredients...');
for (const ingredient of findFloatingIngredients(
  ingredients,
  referencedIngredientSlugs,
)) {
  fail(
    `Floating ingredient "${ingredient.name}" in ${ingredient.filepath} is not referenced by any recipe`,
  );
}
logger.footer('Done!');

reportUntrackedChannels({ ctx, report });
reportBarCasing({ ctx, report });
reportBarLocations({ ctx, report });
reportSimilarNames({ ctx, report });
reportRedundantCategories(ctx);
await reportBookChapters(report);

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
const exitCode = getExitCode();
if (exitCode > 0) {
  logger.failure(`❌ Validation failed! ⏱️ ${elapsed}s`);
} else {
  logger.success(`All good! ⏱️ ${elapsed}s`);
}
process.exit(exitCode);
