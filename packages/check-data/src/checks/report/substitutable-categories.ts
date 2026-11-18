import { logger } from '../../cli-util.ts';
import { ctx } from '../../context/data-context.ts';
import { report } from '../../infra/report.ts';

interface CategoryLike {
  name: string;
  substitutable?: boolean;
  parents?: readonly string[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Categories declared `"substitutable": false` that have fewer than two
 * children: with no children, or a single one, there are no siblings to
 * keep apart, so the flag does nothing. Usually a stale flag left behind
 * by a category split or refile.
 */
export function findInertSubstitutableFlags<T extends CategoryLike>(
  categories: readonly T[],
): T[] {
  const childrenPerParent = new Map<string, number>();
  for (const category of categories) {
    for (const parent of category.parents ?? []) {
      const key = normalizeName(parent);
      childrenPerParent.set(key, (childrenPerParent.get(key) ?? 0) + 1);
    }
  }

  return categories.filter(
    (category) =>
      category.substitutable === false &&
      (childrenPerParent.get(normalizeName(category.name)) ?? 0) < 2,
  );
}

/**
 * Warns about non-substituting categories whose flag cannot have any effect.
 */
export function reportSubstitutableCategories(): void {
  logger.header('🔀 Checking for inert substitutable flags...');

  for (const category of findInertSubstitutableFlags(ctx.allCategories)) {
    report.warn(
      `"substitutable": false on "${category.name}" (${category.filepath}) does nothing: fewer than two children, so no siblings are kept apart. Remove the flag or refile the category.`,
    );
  }

  logger.footer('Done!');
}
