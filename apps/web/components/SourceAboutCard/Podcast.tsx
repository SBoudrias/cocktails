import type { Podcast as PodcastType } from '@cocktails/data';
import { ArrowUpRight, Podcast as PodcastIcon } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
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
  className,
}: {
  source: PodcastType;
  episodeTitle?: string;
  episodeLink?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <PodcastIcon
            className="mr-1 inline size-6 align-text-bottom"
            aria-hidden="true"
          />
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
