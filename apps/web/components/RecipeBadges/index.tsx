import type { Recipe } from '@cocktails/data';
import { Grid, Typography } from '@mui/material';
import RecipeIcon from './RecipeIcon';
import { glasswareShapes, preparationShapes, servedOnShapes } from './shapes';
import styles from './style.module.css';

export default function RecipeBadges({
  recipe,
}: {
  recipe: Pick<Recipe, 'preparation' | 'served_on' | 'glassware'>;
}) {
  const badges = [
    {
      field: 'preparation',
      value: recipe.preparation,
      shape: preparationShapes[recipe.preparation],
    },
    {
      field: 'served-on',
      value: recipe.served_on,
      shape: servedOnShapes[recipe.served_on],
    },
    {
      field: 'glassware',
      value: recipe.glassware,
      shape: glasswareShapes[recipe.glassware],
    },
  ];

  return (
    <Grid
      container
      component="ul"
      aria-label="Preparation, ice and glassware"
      columns={3}
      className={styles.badges}
      sx={{ my: 1 }}
    >
      {badges.map(({ field, value, shape }) => (
        <Grid size={1} component="li" key={field} className={styles.badge}>
          <div className={styles.bubble}>
            <RecipeIcon shape={shape} id={`recipe-icon-${field}`} />
          </div>
          <Typography variant="caption" color="text.secondary" className={styles.caption}>
            {value}
          </Typography>
        </Grid>
      ))}
    </Grid>
  );
}
