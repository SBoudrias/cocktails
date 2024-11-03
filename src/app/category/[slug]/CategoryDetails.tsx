'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import { Card, List, Space } from 'antd-mobile';
import Video from '@/components/Video';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTag } from 'react-icons/fa';
import styles from './category.module.css';
import { getCategoryUrl, getIngredientUrl } from '@/modules/url';

function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <Space wrap>
      {categories.map((category) => (
        <div key={category.slug}>
          <Link href={getCategoryUrl(category)} className={styles.category}>
            {category.name}&nbsp;
            <FaTag />
          </Link>
        </div>
      ))}
    </Space>
  );
}

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
      {(category.description || category.parents.length > 0) && (
        <Card style={{ margin: 12 }}>
          {category.description && <p>{category.description}</p>}
          {category.parents.length > 0 && (
            <p>
              <b>{category.name}</b> is a subset of{' '}
              <CategoryList categories={category.parents} />
            </p>
          )}
        </Card>
      )}
      {category.refs.length > 0 &&
        category.refs.map((ref) => {
          if (ref.type === 'youtube') {
            return <Video key={ref.videoId} id={ref.videoId} start={ref.start} />;
          }
        })}
      {ingredients.length > 0 && (
        <List mode="card" header={`Examples of ${category.name}`}>
          {ingredients.map((ingredient) => (
            <List.Item
              key={ingredient.slug}
              onClick={() => router.push(getIngredientUrl(ingredient))}
            >
              {ingredient.name}
            </List.Item>
          ))}
        </List>
      )}
    </>
  );
}
