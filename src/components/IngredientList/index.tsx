'use client';

import { List, Space } from 'antd-mobile';
import { Ingredient } from '@/types/Ingredient';
import sortIngredients from './sortIngredients';
import styles from './style.module.css';
import Quantity from '@/components/Quantity';

export default function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <List header="Ingredients">
      {sortIngredients(ingredients).map((ingredient) => (
        <List.Item key={ingredient.name}>
          <Space align="baseline" style={{ '--gap': '4px' }}>
            <Quantity
              amount={ingredient.quantity.amount}
              unit={ingredient.quantity.unit}
            />
            <span className={styles.name}>{ingredient.name}</span>
          </Space>
        </List.Item>
      ))}
    </List>
  );
}
