'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Card, List } from 'antd-mobile';

export default function IngredientDetails({
  ingredient,
}: {
  ingredient: BaseIngredient;
}) {
  const listFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'disjunction',
  });

  return (
    <>
      {ingredient.description && <Card>{ingredient.description}</Card>}
      {Array.isArray(ingredient.categories) && ingredient.categories.length > 0 && (
        <List mode="card" header="Substitutions">
          <List.Item>
            Substitute with another <b>{ingredient.categories[0]}</b>.
          </List.Item>
          {ingredient.categories.length > 1 && (
            <List.Item>
              If unavailable, you can try substituting with{' '}
              {listFormatter.format(ingredient.categories.slice(1))}.
            </List.Item>
          )}
        </List>
      )}
    </>
  );
}
