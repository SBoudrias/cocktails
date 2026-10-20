import { logger } from '../../cli-util.ts';
import type { DataContext } from '../../context/data-context.ts';

/**
 * Reports refs pointing to channels that are not tracked sources. Their slugs
 * are kept in the data (the video stays linked) but they get no channel page
 * or listing.
 */
export function reportUntrackedChannels({ ctx }: { ctx: DataContext }): void {
  logger.header('📺 Checking youtube ref channels...');
  for (const [channel, count] of ctx.untrackedRefChannels) {
    logger.warn(
      `Youtube ref channel "${channel}" (${count} ref(s)) is not a tracked youtube-channel source. ` +
        `The videos stay linked, but the channel gets no page or recipe listing. ` +
        `If this is a typo of a tracked channel, fix the slug.`,
    );
  }
  logger.footer('Done!');
}
