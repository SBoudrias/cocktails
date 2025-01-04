'use client';

import { Recipe } from '@/types/Recipe';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import Video from '@/components/Video';
import SourceAboutCard from '../SourceAboutCard';

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
      <SourceAboutCard source={recipe.source} refs={recipe.refs} sx={{ m: 2 }} />
      {recipe.attributions.length > 0 && <RecipeAttributionCard recipe={recipe} />}
    </>
  );
}
