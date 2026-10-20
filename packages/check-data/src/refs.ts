import type { FileCheckInput } from './types.ts';

/**
 * Tracks youtube ref channels that are not tracked sources, for the
 * untracked-channel report. Their slugs are kept in the data (the video stays
 * linked) but they get no channel page or listing. Youtube ref channels power
 * the per-channel recipe lists, so track them for the report below.
 */
export function checkRefs(input: FileCheckInput): void {
  const { data, schemaPath, ctx } = input;

  if (
    schemaPath !== 'schemas/recipe.schema.json' &&
    schemaPath !== 'schemas/category.schema.json' &&
    schemaPath !== 'schemas/ingredient.schema.json'
  ) {
    return;
  }

  for (const ref of data.refs ?? []) {
    if (ref.type !== 'youtube' || !ref.channel) continue;

    if (!ctx.youtubeChannelSlugs.has(ref.channel)) {
      ctx.untrackedRefChannels.set(
        ref.channel,
        (ctx.untrackedRefChannels.get(ref.channel) ?? 0) + 1,
      );
    }
  }
}
