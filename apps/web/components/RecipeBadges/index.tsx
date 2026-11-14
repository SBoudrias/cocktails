import type { Recipe } from '@cocktails/data';
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
    <ul
      aria-label="Preparation, ice and glassware"
      className={`${styles.badges} my-2 grid grid-cols-3`}
    >
      {badges.map(({ field, value, shape }) => (
        <li key={field} className={styles.badge}>
          <div className={styles.bubble}>
            <RecipeIcon shape={shape} id={`recipe-icon-${field}`} />
          </div>
          {/* MUI's caption type: 12px, 1.66 line height, 0.4px tracking */}
          <span
            className={`${styles.caption} text-xs leading-[1.66] tracking-[0.03333em]`}
          >
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}
