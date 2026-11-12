import type { Recipe } from '@cocktails/data';
import { SimpleGrid, Text } from '@mantine/core';
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
    <SimpleGrid
      component="ul"
      cols={3}
      spacing={0}
      my={8}
      aria-label="Preparation, ice and glassware"
      className={styles.badges}
    >
      {badges.map(({ field, value, shape }) => (
        <li key={field} className={styles.badge}>
          <div className={styles.bubble}>
            <RecipeIcon shape={shape} id={`recipe-icon-${field}`} />
          </div>
          {/* MUI's caption type: 12px, 1.66 line height, 0.4px tracking */}
          <Text
            component="span"
            size="xs"
            lh={1.66}
            lts="0.03333em"
            className={styles.caption}
          >
            {value}
          </Text>
        </li>
      ))}
    </SimpleGrid>
  );
}
