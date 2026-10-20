import path from 'node:path';
import {
  isApprovedOverlap,
  normalizeName,
  validateApprovedOverlaps,
} from './approved-overlaps.ts';
import { logger } from './cli-util.ts';
import type { DataContext } from './data-context.ts';
import { findSimilarIngredientPairs } from './ingredient-similarity.ts';
import { areSimilarNames } from './name-similarity.ts';
import { APPROVED_OVERLAPS_PATH, REPO_ROOT } from './paths.ts';
import type { Report } from './report.ts';

/**
 * Similar-name checks: author and bar names that look like misspellings of
 * each other, ingredient names likewise (an unapproved ingredient overlap is
 * fatal), and validation of the approved overlaps registry against the names
 * actually in use.
 */
export function reportSimilarNames(input: { ctx: DataContext; report: Report }): void {
  const { ctx, report } = input;
  const { approvedOverlaps, authorNameUsages, barNameCasings } = ctx;

  // Validate the approved overlaps registry against the names actually in use.
  for (const message of validateApprovedOverlaps(
    approvedOverlaps,
    new Map([
      ...Array.from(
        authorNameUsages.keys(),
        (name) => [normalizeName(name), name] as const,
      ),
      ...Array.from(
        barNameCasings.keys(),
        (name) => [normalizeName(name), name] as const,
      ),
      ...ctx.ingredientNames.map((name) => [normalizeName(name), name] as const),
    ]),
  )) {
    logger.warn(`Approved overlaps registry: ${message}`);
  }

  // Check for similar author and bar names (possible misspellings)
  logger.header('👥 Checking for similar author and bar names...');

  const authorNames = Array.from(authorNameUsages.keys());
  for (const [i, a] of authorNames.entries()) {
    for (const b of authorNames.slice(i + 1)) {
      if (areSimilarNames(a, b) && !isApprovedOverlap(approvedOverlaps, 'author', a, b)) {
        const filesA = authorNameUsages.get(a)!;
        const filesB = authorNameUsages.get(b)!;
        logger.warn(
          `Similar author names — possible misspelling:`,
          `"${a}" (${filesA.length} recipe(s)) vs "${b}" (${filesB.length} recipe(s))`,
          `Review and standardize spelling. If genuinely different people, this is a false positive.`,
        );
      }
    }
  }

  const barKeys = Array.from(barNameCasings.keys());
  for (const [i, a] of barKeys.entries()) {
    for (const b of barKeys.slice(i + 1)) {
      if (areSimilarNames(a, b) && !isApprovedOverlap(approvedOverlaps, 'bar', a, b)) {
        const casingsA = barNameCasings.get(a)!;
        const casingsB = barNameCasings.get(b)!;
        const displayA = Array.from(casingsA.keys())[0] ?? a;
        const displayB = Array.from(casingsB.keys())[0] ?? b;
        const countA = Array.from(casingsA.values()).flat().length;
        const countB = Array.from(casingsB.values()).flat().length;
        logger.warn(
          `Similar bar names — possible misspelling:`,
          `"${displayA}" (${countA} recipe(s)) vs "${displayB}" (${countB} recipe(s))`,
          `Review and standardize spelling. If genuinely different bars, this is a false positive.`,
        );
      }
    }
  }

  logger.footer('Done!');

  // Check for similar ingredient names (possible misspellings)
  logger.header('🥃 Checking for similar ingredient names...');

  for (const { a, b } of findSimilarIngredientPairs(ctx.ingredientNames)) {
    if (isApprovedOverlap(approvedOverlaps, 'ingredient', a, b)) continue;
    const fileA = path.relative(REPO_ROOT, ctx.ingredientFilesByName.get(a)!);
    const fileB = path.relative(REPO_ROOT, ctx.ingredientFilesByName.get(b)!);
    const overlapsPath = path.relative(REPO_ROOT, APPROVED_OVERLAPS_PATH);
    report.fail(
      `Similar ingredient names — possible misspelling: "${a}" (${fileA}) vs "${b}" (${fileB}). ` +
        `Review and standardize spelling. If genuinely different ingredients, register both names in the "ingredient" list of ${overlapsPath} to allow this overlap.`,
    );
  }

  logger.footer('Done!');
}
