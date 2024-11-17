'use client';

import { BaseIngredient } from '@/types/Ingredient';
import Video from '@/components/Video';
import Link from 'next/link';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { getCategoryUrl, getIngredientUrl } from '@/modules/url';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ingredientHasData } from '@/modules/hasData';

export default function IngredientDetails({
  ingredient,
  substitutes,
}: {
  ingredient: BaseIngredient;
  substitutes: BaseIngredient[];
}) {
  const listFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'disjunction',
  });
  const topCategory = ingredient.categories[0];

  let descriptionCard;
  if (ingredient.description) {
    descriptionCard = (
      <Card sx={{ m: 2 }}>
        <CardContent>{ingredient.description}</CardContent>
      </Card>
    );
  } else if (topCategory?.description) {
    descriptionCard = (
      <Card sx={{ m: 2 }}>
        <CardHeader
          title={
            <>
              <LocalOfferIcon />
              &nbsp;{topCategory.name}
            </>
          }
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>{topCategory.description}</CardContent>
        <CardActions sx={{ justifyContent: 'end' }}>
          <Button href={getCategoryUrl(topCategory)}>Learn more</Button>
        </CardActions>
      </Card>
    );
  }

  const refs = [
    ...ingredient.refs,
    ...ingredient.categories.flatMap((c) => c.refs ?? []),
  ];

  return (
    <>
      {descriptionCard}
      {topCategory && (
        <List>
          <ListSubheader>Substitutions</ListSubheader>
          <Paper square>
            <ListItem divider>
              <ListItemText>
                Substitute with another <b>{topCategory.name}</b>.
              </ListItemText>
            </ListItem>
            {ingredient.categories.length > 1 && (
              <ListItem divider>
                <ListItemText>
                  If unavailable, you can try substituting with{' '}
                  {listFormatter.format(
                    ingredient.categories.slice(1).map((c) => c.name),
                  )}
                  .
                </ListItemText>
              </ListItem>
            )}
          </Paper>
        </List>
      )}
      {refs.length > 0 &&
        refs.map((ref) => {
          if (ref.type === 'youtube') {
            return <Video key={ref.videoId} id={ref.videoId} start={ref.start} />;
          }
        })}
      {substitutes.length > 0 && topCategory != null && (
        <List>
          <ListSubheader>Some substitution option</ListSubheader>
          <Paper square>
            {substitutes.slice(0, 10).map((substitute) => {
              if (ingredientHasData(substitute)) {
                return (
                  <Link key={substitute.slug} href={getIngredientUrl(substitute)}>
                    <ListItem divider secondaryAction={<ChevronRightIcon />}>
                      <ListItemText>{substitute.name}</ListItemText>
                    </ListItem>
                  </Link>
                );
              }

              return (
                <ListItem key={substitute.slug} divider>
                  <ListItemText>{substitute.name}</ListItemText>
                </ListItem>
              );
            })}
            <Link href={getCategoryUrl(topCategory)}>
              <ListItem divider secondaryAction={<ChevronRightIcon />}>
                <ListItemText>Learn more</ListItemText>
              </ListItem>
            </Link>
          </Paper>
        </List>
      )}
    </>
  );
}
