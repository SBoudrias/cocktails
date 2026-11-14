import type { YoutubeRef } from '@cocktails/data';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import Video from '#/components/Video';

export default function VideoListCard({
  refs,
  title = 'Video',
  className,
}: {
  refs: YoutubeRef[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {refs.map((ref) => (
        <CardContent key={ref.videoId}>
          <Video id={ref.videoId} start={ref.start} />
        </CardContent>
      ))}
    </Card>
  );
}
