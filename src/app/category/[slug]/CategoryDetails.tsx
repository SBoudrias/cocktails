'use client';
'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import { Card, List } from 'antd-mobile';
import Video from '@/components/Video';
import { useRouter } from 'next/navigation';

export default function CategoryDetails({
  category,
  ingredients,
}: {
  category: Category;
  ingredients: BaseIngredient[];
}) {
  const router = useRouter();

  return (
    <>
      {category.description && <Card style={{ margin: 12 }}>{category.description}</Card>}
      {category.refs.length > 0 &&
        category.refs.map((ref) => {
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
      {ingredients.length > 0 && (
        <List mode="card" header={`Examples of ${category.name}`}>
          {ingredients.map((ingredient) => (
            <List.Item
              key={ingredient.slug}
              onClick={() =>
                router.push(`/ingredient/${ingredient.type}/${ingredient.slug}`)
              }
            >
              {ingredient.name}
            </List.Item>
          ))}
        </List>
      )}
    </>
  );
}
