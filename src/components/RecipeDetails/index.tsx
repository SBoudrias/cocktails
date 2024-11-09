'use client';

import { List } from 'antd-mobile';
import { RecipeIngredient } from '@/types/Ingredient';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';
import { useRouter } from 'next/navigation';
import { Recipe } from '@/types/Recipe';
import UnitSelector, { type Unit } from '../Quantity/Selector';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getIngredientUrl } from '@/modules/url';
import { Grid2, Stack } from '@mui/material';

function IngredientLine({
  ingredient,
  preferredUnit,
}: {
  ingredient: RecipeIngredient;
  preferredUnit: Unit;
}) {
  const router = useRouter();

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
    <List.Item onClick={() => router.push(getIngredientUrl(ingredient))}>
      <Stack direction="row" spacing={0.5} alignItems="baseline">
        <Quantity preferredUnit={preferredUnit} quantity={ingredient.quantity} />
        <div>
          <div className={styles.name}>{ingredient.name}</div>
          {category}
          {brix}
        </div>
      </Stack>
    </List.Item>
  );
}

export default function RecipeDetails({ recipe }: { recipe: Recipe }) {
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
      <List header="Ingredients">
        {sortIngredients(recipe.ingredients).map((ingredient) => (
          <IngredientLine
            key={ingredient.name}
            ingredient={ingredient}
            preferredUnit={preferredUnit}
          />
        ))}
      </List>
      <UnitSelector value={preferredUnit} onChange={setPreferredUnit} />
      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
        <List header="Instructions">
          {recipe.instructions.map((instruction, index) => (
            <List.Item key={index}>
              {index + 1}. {instruction}
            </List.Item>
          ))}
        </List>
      )}
    </>
  );
}
