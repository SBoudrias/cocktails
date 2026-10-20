import path from 'node:path';
import type { FileCheckInput } from '../../infra/types.ts';

/**
 * Validates the typed source refs on author entities — bars they worked at
 * alongside books/channels/podcasts they are behind. Every ref must resolve
 * to an entity file or a source folder.
 */
export function checkAuthorSources({
  data,
  file,
  schemaPath,
  ctx,
  report,
}: FileCheckInput): void {
  if (schemaPath !== 'schemas/author.schema.json') return;

  for (const source of data.sources ?? []) {
    if (source.type === 'bar') {
      if (!ctx.barEntitySlugs.has(source.slug)) {
        report.fail(
          `Author "${data.name}" references unknown bar "${source.slug}" in ${path.basename(file)}. ` +
            `Use the slug of a bar entity file (name and location).`,
        );
      }
      continue;
    }

    const slugs = ctx.sourceSlugsByType.get(source.type);
    if (!slugs || !slugs.has(source.slug)) {
      report.fail(
        `Author "${data.name}" references unknown ${source.type} source "${source.slug}" in ${path.basename(file)}.`,
      );
    }
  }
}
