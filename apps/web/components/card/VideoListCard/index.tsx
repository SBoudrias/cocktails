import type { YoutubeRef } from '@cocktails/data';
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from '@ui-sdk/react/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardMargin,
} from '#/components/ui/card';
import Video from '#/components/Video';

// The same video can appear twice at different timestamps, so the key
// carries the start.
const refKey = (ref: YoutubeRef) => `${ref.videoId}-${ref.start ?? 0}`;

// The app's control look over web.css's neutral button defaults (its
// --ui-* tokens are light/dark greys that clash with the jade palette).
const controlClass =
  'cursor-pointer rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function VideoListCard({
  refs,
  title = 'Video',
  m,
}: {
  refs: YoutubeRef[];
  title?: string;
  m?: CardMargin;
}) {
  return (
    <Card m={m}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {refs.length < 2 ? (
          refs.map((ref) => (
            <Video key={refKey(ref)} id={ref.videoId} start={ref.start} />
          ))
        ) : (
          <Carousel
            aria-label={title}
            loop
            // items-stretch: web.css's centered grid tracks would shrink
            // the viewport in this column flex — the video spans the card.
            className="flex w-full max-w-none flex-col items-stretch gap-2"
          >
            <CarouselViewport>
              <CarouselContent>
                {refs.map((ref) => (
                  <CarouselItem key={refKey(ref)}>
                    <Video id={ref.videoId} start={ref.start} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </CarouselViewport>
            <div className="flex items-center justify-center gap-2">
              <CarouselPrevious aria-label="Previous video" className={controlClass}>
                <ChevronLeft />
              </CarouselPrevious>
              <CarouselIndicatorGroup
                aria-label="Choose a video"
                // items-center: web.css aligns flex rows to the start, so
                // the dots would grow downward instead of sharing one axis.
                className="items-center gap-2"
              >
                {refs.map((ref, index) => (
                  <CarouselIndicator
                    key={refKey(ref)}
                    page={index + 1}
                    aria-label={`Video ${index + 1}`}
                    // scale, not size: the selected dot's growth never
                    // reflows the row, so sibling dots stay put.
                    className="size-2.5 rounded-full border-0 bg-foreground/30 p-0 transition-transform motion-reduce:transition-none hover:bg-foreground/50 data-selected:scale-120 data-selected:bg-primary data-selected:hover:bg-primary"
                  />
                ))}
              </CarouselIndicatorGroup>
              <CarouselNext aria-label="Next video" className={controlClass}>
                <ChevronRight />
              </CarouselNext>
            </div>
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
}
