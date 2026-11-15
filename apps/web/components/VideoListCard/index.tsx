import type { YoutubeRef } from '@cocktails/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardMargin,
} from '#/components/ui/card';
import Video from '#/components/Video';

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
      {refs.map((ref) => (
        <CardContent key={ref.videoId}>
          <Video id={ref.videoId} start={ref.start} />
        </CardContent>
      ))}
    </Card>
  );
}
