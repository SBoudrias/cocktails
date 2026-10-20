#!/usr/bin/env -S node --no-warnings

import { reportBarCasing } from './bar-casing.ts';
import { reportBarLocations } from './bar-locations-check.ts';
import { reportBookChapters } from './book-chapters.ts';
import { logger } from './cli-util.ts';
import { loadDataContext } from './data-context.ts';
import { findFloatingIngredients } from './floating-ingredients.ts';
import { reportRedundantCategories } from './redundant-categories.ts';
import { createReport } from './report.ts';
import { loadSchemas } from './schemas.ts';
import { reportSimilarNames } from './similar-names.ts';
import { reportUntrackedChannels } from './untracked-channels.ts';
import { validateFiles } from './validate-files.ts';
import { createWriteJSON } from './write-json.ts';

const startTime = performance.now();

const { report, getExitCode } = createReport();

const { ajv, formatter } = await loadSchemas();
const writeJSON = createWriteJSON({ formatter, report });

const ctx = await loadDataContext({ writeJSON, report });
const { ingredients, referencedIngredientSlugs } = ctx;

await validateFiles({ ajv, formatter, ctx, report, writeJSON });

logger.header('🛟 Checking for floating ingredients...');
for (const ingredient of findFloatingIngredients(
  ingredients,
  referencedIngredientSlugs,
)) {
  report.fail(
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
