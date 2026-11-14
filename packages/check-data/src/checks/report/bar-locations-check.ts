import path from 'node:path';
import { logger } from '../../cli-util.ts';
import { ctx } from '../../context/data-context.ts';
import { REPO_ROOT } from '../../infra/paths.ts';
import { report } from '../../infra/report.ts';
import { isApprovedOverlap, normalizeName } from './approved-overlaps.ts';
import { findInconsistentBarLocations, findSimilarBarNames } from './bar-locations.ts';
import { findInvalidLocationFormats } from './location-format.ts';

/**
 * Reports bar locations that don't follow the location convention, bars
 * credited under the same name with inconsistent locations, and bar names
 * that look like one venue recorded at two precisions. The approved overlaps
 * registry hides names reviewed as genuinely multi-venue bars or distinct
 * venues.
 */
export function reportBarLocations(): void {
  // Check every credited location against the convention: the last segment
  // must be a two-letter state/province code or a country from the
  // allowlists — "City, ST" or "City, Country", a bare country when nothing
  // more is known, and a venue or neighborhood may lead the chain
  // ("Disneyland, Anaheim, CA").
  logger.header('📍 Checking bar locations...');
  for (const issue of findInvalidLocationFormats(ctx.barLocationUsages)) {
    const suggestion = issue.suggestedCode
      ? ` Use the 2-letter code instead, e.g. "${issue.location.replace(issue.region, issue.suggestedCode)}".`
      : ` Unknown region "${issue.region}" — use a 2-letter state/province code or a known country name.`;
    report.fail(
      `Bar "${issue.name}" has a non-standard location "${issue.location}" in ${path.relative(REPO_ROOT, issue.exampleFile)}.${suggestion}`,
    );
  }
  logger.footer('Done!');

  // Check for bars credited under the same name with inconsistent locations —
  // two different locations, or the same name with and without one. Usually a
  // drifted "City, ST" on one attribution; the approved overlaps registry hides
  // names reviewed as genuinely multi-venue bars.
  logger.header('📍 Checking for inconsistent bar locations...');
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
