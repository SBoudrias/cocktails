import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import { ArrowUpRight } from 'lucide-react';
import YoutubeIcon from '#/components/icons/YoutubeIcon';
import { buttonVariants } from '#/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardFooter,
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
        <CardTitle className="flex items-center gap-2 text-2xl font-normal">
          <YoutubeIcon className="size-6" />
          {source.name}
        </CardTitle>
      </CardHeader>
      {videoRef && (
        <CardContent>
          <Video id={videoRef.videoId} start={videoRef.start} />
        </CardContent>
      )}
      <CardContent className="text-muted-foreground">{source.description}</CardContent>
      <CardFooter className="justify-end border-0 bg-transparent px-2 pt-0 pb-2">
        <a
          href={source.links[0]}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonVariants({ variant: 'ghost' })}
        >
          Go to channel
          <ArrowUpRight />
        </a>
      </CardFooter>
    </Card>
  );
}
