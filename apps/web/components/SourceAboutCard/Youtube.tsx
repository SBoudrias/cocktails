import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import { ArrowUpRight } from 'lucide-react';
import YoutubeIcon from '#/components/icons/YoutubeIcon';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import Video from '#/components/Video';

export default function YoutubeAboutCard({
  source,
  videoRef,
  className,
}: {
  source: YoutubeChannel;
  videoRef?: YoutubeRef;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <YoutubeIcon className="mr-1 inline size-6 align-text-bottom" />
          {source.name}
        </CardTitle>
      </CardHeader>
      {videoRef && (
        <CardContent>
          <Video id={videoRef.videoId} start={videoRef.start} />
        </CardContent>
      )}
      <CardContent>
        <p className="text-muted-foreground">{source.description}</p>
      </CardContent>
      <CardActions>
        <a
          href={source.links[0]}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonVariants({ variant: 'text-inherit' })}
        >
          Go to channel
          <ArrowUpRight className="-mr-1 ml-2 size-6" aria-hidden="true" />
        </a>
      </CardActions>
    </Card>
  );
}
