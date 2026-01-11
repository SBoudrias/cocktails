import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography,
  type SxProps,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import type { Book } from '@/types/Source';

export default function BookAboutCard({
  source,
  page,
  sx,
}: {
  source: Book;
  page?: number;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <>
            <BookIcon />
            &nbsp;{source.name}
          </>
        }
        subheader={page ? `page ${page}` : undefined}
      />
      <CardContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {source.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'end' }}>
        <Button href={source.link} target="_blank" rel="noreferrer" color="inherit">
          Learn more
          <ArrowOutwardIcon />
        </Button>
      </CardActions>
    </Card>
  );
}
