import { logger } from './cli-util.ts';
import type { DataContext } from './data-context.ts';
import type { Report } from './report.ts';

/**
 * Fails when one bar is credited under the same name with inconsistent
 * casing across recipe files — one lowercase name keyed to several exact
 * spellings.
 */
export function reportBarCasing(input: { ctx: DataContext; report: Report }): void {
  const { ctx, report } = input;

  logger.header('🍸 Checking bar name consistency...');
  for (const [, casings] of ctx.barNameCasings) {
    if (casings.size > 1) {
      const variants = Array.from(casings.entries())
        .map(([casing, files]) => `"${casing}" in ${files.length} file(s)`)
        .join(', ');
      report.fail(`Bar name has inconsistent casing: ${variants}`);
    }
  }
  logger.footer('Done!');
}
