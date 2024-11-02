'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Button, Card, List } from 'antd-mobile';
import Video from '@/components/Video';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTag } from 'react-icons/fa';
import styles from './styles.module.css';
import { getCategoryUrl } from '@/modules/url';

export default function IngredientDetails({
  ingredient,
  substitutes,
}: {
  ingredient: BaseIngredient;
  substitutes: BaseIngredient[];
}) {
  const router = useRouter();
  const listFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'disjunction',
  });
  const topCategory = ingredient.categories[0];

  let descriptionCard;
  if (ingredient.description) {
    descriptionCard = <Card style={{ margin: 12 }}>{ingredient.description}</Card>;
  } else if (topCategory?.description) {
    descriptionCard = (
      <Card
        style={{ margin: 12 }}
        title={
          <>
            <FaTag />
            &nbsp;{topCategory.name}
          </>
        }
      >
        <p>{topCategory.description}</p>
        <div className={styles.footer}>
          <Link href={getCategoryUrl(topCategory)}>
            <Button color="primary">Learn more</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const refs = ingredient.categories.flatMap((c) => c.refs ?? []);

  return (
    <>
      {descriptionCard}
      {topCategory && (
        <List mode="card" header="Substitution">
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
      {substitutes.length > 0 && topCategory != null && (
        <List mode="card" header={`Other ${topCategory.name}`}>
          {substitutes.slice(0, 10).map((substitute) => (
            <List.Item key={substitute.slug}>{substitute.name}</List.Item>
          ))}
          <List.Item onClick={() => router.push(getCategoryUrl(topCategory))}>
            Learn more
          </List.Item>
        </List>
      )}
    </>
  );
}
