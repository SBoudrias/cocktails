import path from 'node:path';
import { logger } from '../../cli-util.ts';
import type { DataContext } from '../../context/data-context.ts';
import { REPO_ROOT } from '../../infra/paths.ts';
import { findRedundantCategoryPairs } from './category-similarity.ts';

/**
 * Reports category names that look like the same product registered under
 * two names — both same-type, one name close to the other.
 */
export function reportRedundantCategories(ctx: DataContext): void {
  logger.header('🏷️ Checking for redundant category names...');

  for (const { a, b } of findRedundantCategoryPairs(ctx.allCategories)) {
    logger.warn(
      `Similar category names — possible duplicate:`,
      `"${a.name}" (${path.relative(REPO_ROOT, a.filepath)}) vs "${b.name}" (${path.relative(REPO_ROOT, b.filepath)}).`,
      `Both are ${a.categoryType} categories. Merge them into one, or — for a generic parent grouping substitution-friendly variants (e.g. "Falernum" → "Falernum liqueur") — declare the relationship with "parents".`,
    );
  }

  logger.footer('Done!');
}
