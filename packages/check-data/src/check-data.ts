#!/usr/bin/env -S node --no-warnings

import { validateFiles } from './checks/per-file/validate-files.ts';
import { reportBarCasing } from './checks/report/bar-casing.ts';
import { reportBarLocations } from './checks/report/bar-locations-check.ts';
import { reportBookChapters } from './checks/report/book-chapters.ts';
import { findFloatingIngredients } from './checks/report/floating-ingredients.ts';
import { reportRedundantCategories } from './checks/report/redundant-categories.ts';
import { reportSimilarNames } from './checks/report/similar-names.ts';
import { reportUntrackedChannels } from './checks/report/untracked-channels.ts';
import { logger } from './cli-util.ts';
import { loadDataContext } from './context/data-context.ts';
import { createReport } from './infra/report.ts';
import { loadSchemas } from './infra/schemas.ts';
import { createWriteJSON } from './infra/write-json.ts';

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
