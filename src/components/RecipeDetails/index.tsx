'use client';

import { List, Space, Grid } from 'antd-mobile';
import { RecipeIngredient } from '@/types/Ingredient';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';
import { useRouter } from 'next/navigation';
import { Recipe } from '@/types/Recipe';

function IngredientLine({ ingredient }: { ingredient: RecipeIngredient }) {
  const router = useRouter();

  let category;
  if (Array.isArray(ingredient.categories) && ingredient.categories[0] != null) {
    const label = ingredient.categories[0]!;
    category = <div className={styles.category}>{label}</div>;
  }

  let brix;
  if ('brix' in ingredient) {
    brix = <div className={styles.category}>{ingredient.brix} Brix</div>;
  }

  return (
    <List.Item
      onClick={() => router.push(`/ingredient/${ingredient.type}/${ingredient.slug}`)}
    >
      <Space align="baseline" style={{ '--gap': '4px' }}>
        <Quantity amount={ingredient.quantity.amount} unit={ingredient.quantity.unit} />
        <div>
          <div className={styles.name}>{ingredient.name}</div>
          {category}
          {brix}
        </div>
      </Space>
    </List.Item>
  );
}

export default function RecipeDetails({ recipe }: { recipe: Recipe }) {
  return (
    <>
      <Grid columns={3} gap={12} style={{ padding: '0 12px', textAlign: 'center' }}>
        <Grid.Item>
          <div className={styles.badge}>{recipe.preparation}</div>
        </Grid.Item>
        <Grid.Item>
          <div className={styles.badge}>{recipe.served_on}</div>
        </Grid.Item>
        <Grid.Item>
          <div className={styles.badge}>{recipe.glassware}</div>
        </Grid.Item>
      </Grid>
      <List header="Ingredients">
        {sortIngredients(recipe.ingredients).map((ingredient) => (
          <IngredientLine key={ingredient.name} ingredient={ingredient} />
        ))}
      </List>
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
