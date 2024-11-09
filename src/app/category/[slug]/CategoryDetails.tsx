'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import Video from '@/components/Video';
import Link from 'next/link';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { FaTag } from 'react-icons/fa';
import styles from './category.module.css';
import { getCategoryUrl, getIngredientUrl } from '@/modules/url';
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexWrap: 'wrap' }}>
      {categories.map((category) => (
        <div key={category.slug}>
          <Link href={getCategoryUrl(category)} className={styles.category}>
            {category.name}&nbsp;
            <FaTag />
          </Link>
        </div>
      ))}
    </Stack>
  );
}

export default function CategoryDetails({
  category,
  ingredients,
}: {
  category: Category;
  ingredients: BaseIngredient[];
}) {
  return (
    <>
      {(category.description || category.parents.length > 0) && (
        <Card sx={{ m: 2 }}>
          {category.description && (
            <CardContent>
              <Typography variant="body2">{category.description}</Typography>
            </CardContent>
          )}
          {category.parents.length > 0 && (
            <CardContent>
              <b>{category.name}</b> is a subset of{' '}
              <CategoryList categories={category.parents} />
            </CardContent>
          )}
        </Card>
      )}
      {category.refs.length > 0 &&
        category.refs.map((ref) => {
          if (ref.type === 'youtube') {
            return <Video key={ref.videoId} id={ref.videoId} start={ref.start} />;
          }
        })}
      {ingredients.length > 0 && (
        <List>
          <ListSubheader>Examples of {category.name}</ListSubheader>
          <Paper square>
            {ingredients.map((ingredient) => (
              <Link key={ingredient.slug} href={getIngredientUrl(ingredient)}>
                <ListItem divider secondaryAction={<ChevronRightIcon />}>
                  <ListItemText>{ingredient.name}</ListItemText>
                </ListItem>
              </Link>
            ))}
          </Paper>
        </List>
      )}
    </>
  );
}
