import type { YoutubeRef, YoutubeChannel } from '@cocktails/data';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography,
  type SxProps,
} from '@mui/material';
import { ArrowUpRight } from 'lucide-react';
import YoutubeIcon from '#/components/icons/YoutubeIcon';
import Video from '#/components/Video';

export default function YoutubeAboutCard({
  source,
  videoRef,
  sx,
}: {
  source: YoutubeChannel;
  videoRef?: YoutubeRef;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <YoutubeIcon />
            &nbsp;{source.name}
          </>
        }
      />
      {videoRef && (
        <CardContent>
          <Video id={videoRef.videoId} start={videoRef.start} />
        </CardContent>
      )}
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {source.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'end' }}>
        <Button
          href={source.links[0]}
          target="_blank"
          rel="noreferrer noopener"
          color="inherit"
        >
          Go to channel
          <ArrowUpRight className="size-6" />
        </Button>
      </CardActions>
    </Card>
  );
}
