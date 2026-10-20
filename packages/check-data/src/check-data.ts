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
import { ctx, loadContext } from './context/data-context.ts';
import { report } from './infra/report.ts';
import { startTime } from './infra/start.ts';

await loadContext();
await validateFiles();

logger.header('🛟 Checking for floating ingredients...');
for (const ingredient of findFloatingIngredients(
  ctx.ingredients,
  ctx.referencedIngredientSlugs,
)) {
  report.fail(
    `Floating ingredient "${ingredient.name}" in ${ingredient.filepath} is not referenced by any recipe`,
  );
}
logger.footer('Done!');

reportUntrackedChannels();
reportBarCasing();
reportBarLocations();
reportSimilarNames();
reportRedundantCategories();
await reportBookChapters();

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
const exitCode = report.getExitCode();
if (exitCode > 0) {
  logger.failure(`❌ Validation failed! ⏱️ ${elapsed}s`);
} else {
  logger.success(`All good! ⏱️ ${elapsed}s`);
}
process.exit(exitCode);
