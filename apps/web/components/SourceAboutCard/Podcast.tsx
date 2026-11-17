import type { Podcast as PodcastType } from '@cocktails/data';
import { ArrowUpRight, Podcast as PodcastIcon } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  type CardMargin,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardSubheader,
  CardTitle,
} from '#/components/ui/card';

export default function PodcastAboutCard({
  source,
  episodeTitle,
  episodeLink,
  m,
}: {
  source: PodcastType;
  episodeTitle?: string;
  episodeLink?: string;
  m?: CardMargin;
}) {
  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>
          <PodcastIcon aria-hidden="true" />
          {source.name}
        </CardTitle>
        {episodeTitle && <CardSubheader>Episode: {episodeTitle}</CardSubheader>}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{source.description}</p>
      </CardContent>
      <CardActions>
        <a
          href={episodeLink || source.link}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonVariants({ variant: 'text-inherit' })}
        >
          {episodeLink ? 'Listen to episode' : 'Listen to podcast'}
          <ArrowUpRight className="-mr-1 ml-2 size-6" aria-hidden="true" />
        </a>
      </CardActions>
    </Card>
  );
}
