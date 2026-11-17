import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import { ArrowUpRight } from 'lucide-react';
import { siYoutube } from 'simple-icons';
import BrandIcon from '#/components/icons/BrandIcon';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  type CardMargin,
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
  m,
}: {
  source: YoutubeChannel;
  videoRef?: YoutubeRef;
  m?: CardMargin;
}) {
  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>
          <span className="mr-1.5 inline-flex align-text-top">
            <BrandIcon icon={siYoutube} size={6} />
          </span>
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
