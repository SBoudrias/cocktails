import type { SxProps } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import {
  Card,
  CardContent,
  CardHeader,
  Link,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import type { Recipe } from '@/types/Recipe';

const attributionRelationLabels = {
  'recipe author': 'Created by',
  'adapted by': 'Adapted by',
  bar: 'Served at',
  book: 'Documented by',
};

export default function RecipeAttributionCard({
  recipe,
  sx,
}: {
  recipe: Recipe;
  sx?: SxProps;
}) {
  return (
    <Card sx={sx}>
      <CardHeader title="Attributions" />
      <CardContent
        // Reduce padding given the table already includes a lot of whitespace
        sx={{ px: 1, py: 0, ':last-child': { pb: 0 } }}
      >
        <Table>
          <TableBody>
            {recipe.attributions.map((attribution) => {
              let name = attribution.source;
              if (attribution.relation === 'bar' && attribution.location) {
                name += `, ${attribution.location}`;
              }

              return (
                <TableRow
                  key={attribution.source}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th">
                    {attributionRelationLabels[attribution.relation]}
                  </TableCell>
                  <TableCell>
                    {attribution.url ? (
                      <Link
                        href={attribution.url}
                        target="_blank"
                        rel="noopener nofollow"
                      >
                        {name}
                        <ArrowOutwardIcon sx={{ fontSize: 'medium' }} />
                      </Link>
                    ) : (
                      name
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
