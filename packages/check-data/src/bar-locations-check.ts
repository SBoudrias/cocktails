import path from 'node:path';
import { isApprovedOverlap, normalizeName } from './approved-overlaps.ts';
import { findInconsistentBarLocations, findSimilarBarNames } from './bar-locations.ts';
import { logger } from './cli-util.ts';
import type { DataContext } from './data-context.ts';
import { REPO_ROOT } from './paths.ts';
import type { Report } from './report.ts';

/**
 * Reports bars credited under the same name with inconsistent locations, and
 * bar names that look like one venue recorded at two precisions. The approved
 * overlaps registry hides names reviewed as genuinely multi-venue bars or
 * distinct venues.
 */
export function reportBarLocations(input: { ctx: DataContext; report: Report }): void {
  const { ctx } = input;

  // Check for bars credited under the same name with inconsistent locations —
  // two different locations, or the same name with and without one. Usually a
  // drifted "City, ST" on one attribution; the approved overlaps registry hides
  // names reviewed as genuinely multi-venue bars.
  logger.header('📍 Checking bar locations...');
  const approvedBarNames = new Set(
    (ctx.approvedOverlaps.bar ?? []).map((name) => normalizeName(name)),
  );
  for (const { name, variants } of findInconsistentBarLocations(ctx.barLocationUsages)) {
    if (approvedBarNames.has(normalizeName(name))) continue;

    const summary = variants
      .map(
        (variant) =>
          `"${variant.location ?? 'no location'}" (${variant.count} use(s), e.g. ${path.relative(REPO_ROOT, variant.exampleFile)})`,
      )
      .join(', ');
    logger.warn(
      `Bar "${name}" is credited with inconsistent locations:`,
      summary,
      `Standardize the location across attributions and entity files. ` +
        `If these are genuinely different venues, register the name in the "bar" list of approved-overlaps.json.`,
    );
  }
  logger.footer('Done!');

  // Check for bar names that look like one venue recorded at two precisions —
  // one name contained inside the other plus one or two extra words. Renames
  // and short-form credits ("Caribe Hilton" vs "Caribe Hilton Hotel") look
  // like this; the approved overlaps registry hides reviewed pairs.
  logger.header('📍 Checking for similar bar names...');
  for (const { shortName, longName, extras } of findSimilarBarNames(
    ctx.barLocationUsages,
  )) {
    if (isApprovedOverlap(ctx.approvedOverlaps, 'bar', shortName, longName)) continue;

    logger.warn(
      `Similar bar names — possible duplicate:`,
      `"${shortName}" vs "${longName}" (adds: ${extras.join(', ')})`,
      `Review whether these are the same venue recorded at two precisions. ` +
        `If genuinely different venues, register both names in the "bar" list of approved-overlaps.json.`,
    );
  }
  logger.footer('Done!');
}
