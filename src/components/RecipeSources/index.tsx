'use client';

import { Recipe } from '@/types/Recipe';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import Video from '@/components/Video';
import { BookRef, YoutubeRef } from '@/types/Ref';
import BookIcon from '@mui/icons-material/Book';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

const attributionRelationLabels = {
  'recipe author': 'Original recipe by',
  'adapted by': 'Adapted by',
  bar: 'Bar',
};

function RecipeAttributionCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Table>
          <TableBody>
            {recipe.attributions.map((attribution) => (
              <TableRow
                key={attribution.source}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th">
                  {attributionRelationLabels[attribution.relation]}
                </TableCell>
                <TableCell>{attribution.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function RecipeSources({ recipe }: { recipe: Recipe }) {
  let sourceBlock;
  if (recipe.source.type === 'book') {
    const ref = recipe.refs.find(
      (ref): ref is BookRef => ref.type === 'book' && ref.title === recipe.source.slug,
    );
    sourceBlock = (
      <Card sx={{ m: 2 }}>
        <CardHeader
          title={
            <>
              <BookIcon />
              &nbsp;{recipe.source.name}
            </>
          }
          subheader={ref ? `page ${ref.page}` : undefined}
        />
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {recipe.source.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'end' }}>
          <Button
            href={recipe.source.link}
            target="_blank"
            rel="noreferrer"
            color="inherit"
          >
            Learn more
            <ArrowOutwardIcon />
          </Button>
        </CardActions>
      </Card>
    );
  } else if (recipe.source.type === 'youtube-channel') {
    const ref = recipe.refs.find((ref): ref is YoutubeRef => ref.type === 'youtube');
    sourceBlock = (
      <Card sx={{ m: 2 }}>
        <CardHeader
          title={
            <>
              <YouTubeIcon />
              &nbsp;{recipe.source.name}
            </>
          }
        />
        <CardContent>
          {ref && <Video id={ref.videoId} start={ref.start} />}
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: ref ? 1 : 0 }}>
            {recipe.source.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'end' }}>
          <Button
            href={recipe.source.link}
            target="_blank"
            rel="noreferrer"
            color="inherit"
          >
            View on Youtube
            <ArrowOutwardIcon />
          </Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <>
      {recipe.source.type !== 'youtube-channel' &&
        recipe.refs.map((ref) => {
          if (ref.type === 'youtube') {
            return (
              <Card key={ref.videoId} sx={{ m: 2 }}>
                <CardHeader title="Video" />
                <CardContent>
                  <Video id={ref.videoId} start={ref.start} />
                </CardContent>
              </Card>
            );
          }
        })}
      {sourceBlock}
      {recipe.attributions.length > 0 && <RecipeAttributionCard recipe={recipe} />}
    </>
  );
}
