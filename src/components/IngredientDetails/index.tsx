'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Card, List, Space } from 'antd-mobile';
import Video from '@/components/Video';

export default function IngredientDetails({
  ingredient,
}: {
  ingredient: BaseIngredient;
}) {
  const listFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'disjunction',
  });
  const topCategory = ingredient.categories[0];

  let descriptionCard;
  if (ingredient.description) {
    descriptionCard = <Card style={{ margin: 12 }}>{ingredient.description}</Card>;
  } else if (topCategory.description) {
    descriptionCard = (
      <Card style={{ margin: 12 }} title={topCategory.name}>
        {topCategory.description}
      </Card>
    );
  }

  const refs = ingredient.categories.flatMap((c) => c.refs ?? []);

  return (
    <>
      {descriptionCard}
      {ingredient.categories.length > 0 && (
        <List mode="card" header="Substitutions">
          <List.Item>
            Substitute with another <b>{topCategory.name}</b>.
          </List.Item>
          {ingredient.categories.length > 1 && (
            <List.Item>
              If unavailable, you can try substituting with{' '}
              {listFormatter.format(ingredient.categories.slice(1).map((c) => c.name))}.
            </List.Item>
          )}
        </List>
      )}
      {refs.length > 0 &&
        refs.map((ref) => {
          if (ref.type === 'youtube') {
            return (
              <Video
                key={ref.videoId}
                id={ref.videoId}
                opts={{ playerVars: { start: ref.start } }}
              />
            );
          }
        })}
    </>
  );
}
