import type { Podcast } from '@cocktails/data';
import { ArrowUpRight, Podcast as PodcastIcon } from 'lucide-react';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

export default function PodcastAboutCard({
  source,
  episodeTitle,
  episodeLink,
  className,
}: {
  source: Podcast;
  episodeTitle?: string;
  episodeLink?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-normal">
          <PodcastIcon className="size-6" />
          {source.name}
        </CardTitle>
        {episodeTitle && <CardDescription>Episode: {episodeTitle}</CardDescription>}
      </CardHeader>
      <CardContent className="text-muted-foreground">{source.description}</CardContent>
      <CardFooter className="justify-end border-0 bg-transparent px-2 pt-0 pb-2">
        <a
          href={episodeLink || source.link}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonVariants({ variant: 'ghost' })}
        >
          {episodeLink ? 'Listen to episode' : 'Listen to podcast'}
          <ArrowUpRight />
        </a>
      </CardFooter>
    </Card>
  );
}
