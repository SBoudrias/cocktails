'use client';
'use client';

import { BaseIngredient } from '@/types/Ingredient';
import { Category } from '@/types/Category';
import { Card, List, Space } from 'antd-mobile';
import Video from '@/components/Video';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTag } from 'react-icons/fa';
import slugify from '@sindresorhus/slugify';
import styles from './category.module.css';

function CategoryList({ categories }: { categories: string[] }) {
  return (
    <Space wrap>
      {categories.map((category) => (
        <div>
          <Link
            href={`/category/${slugify(category)}`}
            key={category}
            className={styles.category}
          >
            {category}&nbsp;
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
