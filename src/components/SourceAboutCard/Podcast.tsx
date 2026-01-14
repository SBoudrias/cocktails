import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography,
  type SxProps,
} from '@mui/material';
import type { Podcast } from '@/types/Source';

export default function PodcastAboutCard({
  source,
  episodeTitle,
  episodeLink,
  sx,
}: {
  source: Podcast;
  episodeTitle?: string;
  episodeLink?: string;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <PodcastsIcon />
            &nbsp;{source.name}
          </>
        }
        subheader={episodeTitle ? `Episode: ${episodeTitle}` : undefined}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {source.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'end' }}>
        <Button
          href={episodeLink || source.link}
          target="_blank"
          rel="noreferrer noopener"
          color="inherit"
        >
          {episodeLink ? 'Listen to episode' : 'Listen to podcast'}
          <ArrowOutwardIcon />
        </Button>
      </CardActions>
    </Card>
  );
}
