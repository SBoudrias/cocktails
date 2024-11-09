'use client';

import { RecipeIngredient } from '@/types/Ingredient';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';
import { useRouter } from 'next/navigation';
import { Recipe } from '@/types/Recipe';
import UnitSelector, { type Unit } from '../Quantity/Selector';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getIngredientUrl } from '@/modules/url';
import {
  Grid2,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';

function IngredientLine({
  ingredient,
  preferredUnit,
}: {
  ingredient: RecipeIngredient;
  preferredUnit: Unit;
}) {
  let category;
  if (
    ingredient.type !== 'syrup' &&
    Array.isArray(ingredient.categories) &&
    ingredient.categories[0] != null
  ) {
    const label = ingredient.categories[0]!.name;
    category = <div className={styles.category}>{label}</div>;
  }

  let brix;
  if ('brix' in ingredient) {
    brix = <div className={styles.category}>{ingredient.brix} Brix</div>;
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />
      <div>
        <div className={styles.name}>{ingredient.name}</div>
        {category}
        {brix}
      </div>
    </Stack>
  );
}

export default function RecipeDetails({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [preferredUnit, setPreferredUnit] = useLocalStorage<Unit>('preferred_unit', 'oz');

  return (
    <>
      <Grid2 container columns={3} sx={{ textAlign: 'center', my: 1 }}>
        <Grid2 size={1}>
          <div className={styles.badge}>{recipe.preparation}</div>
        </Grid2>
        <Grid2 size={1}>
          <div className={styles.badge}>{recipe.served_on}</div>
        </Grid2>
        <Grid2 size={1}>
          <div className={styles.badge}>{recipe.glassware}</div>
        </Grid2>
      </Grid2>
      <List>
        <ListSubheader>Ingredients</ListSubheader>
        <Paper square>
          {sortIngredients(recipe.ingredients).map((ingredient) => (
            <Link key={ingredient.slug} href={getIngredientUrl(ingredient)}>
              <ListItem divider secondaryAction={<ChevronRightIcon />}>
                <ListItemText>
                  <IngredientLine ingredient={ingredient} preferredUnit={preferredUnit} />
                </ListItemText>
              </ListItem>
            </Link>
          ))}
        </Paper>
      </List>
      <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
        <List>
          <ListSubheader>Instructions</ListSubheader>
          <Paper square>
            {recipe.instructions.map((instruction, index) => (
              <ListItem divider key={index}>
                <ListItemText>
                  {index + 1}. {instruction}
                </ListItemText>
              </ListItem>
            ))}
          </Paper>
        </List>
      )}
    </>
  );
}
