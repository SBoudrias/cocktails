'use client';

import { Attribution, Recipe } from '@/types/Recipe';
import { Button, Card, List, Space } from 'antd-mobile';
import { FiBook, FiYoutube, FiExternalLink } from 'react-icons/fi';
import Video from '@/components/Video';
import { BookRef } from '@/types/Ref';

function AttributionName({ attribution }: { attribution: Attribution }) {
  if (attribution.url) {
    return (
      <a href={attribution.url} target="_blank" rel="noreferrer">
        <Space>
          <b>{attribution.source}</b>
          <FiExternalLink style={{ fontSize: '18px' }} />
        </Space>
      </a>
    );
  }

  return <b>{attribution.source}</b>;
}

function AttributionLine({ attribution }: { attribution: Attribution }) {
  switch (attribution.relation) {
    case 'recipe author':
      return (
        <List.Item>
          <span>Original recipe by&nbsp;</span>
          <AttributionName attribution={attribution} />
        </List.Item>
      );
    case 'adapted by':
      return (
        <List.Item>
          <span>Adapted by&nbsp;</span>
          <AttributionName attribution={attribution} />
        </List.Item>
      );
    case 'bar':
      return (
        <List.Item>
          <span>Bar:&nbsp;</span>
          <AttributionName attribution={attribution} />
        </List.Item>
      );
  }
}

export default function RecipeSources({ recipe }: { recipe: Recipe }) {
  let sourceBlock;
  switch (recipe.source.type) {
    case 'book':
      const ref = recipe.refs.find(
        (ref): ref is BookRef => ref.type === 'book' && ref.title === recipe.source.slug,
      );
      sourceBlock = (
        <Card
          title={
            <>
              <FiBook style={{ fontSize: '18px' }} /> {recipe.source.name}
            </>
          }
          extra={ref ? `page ${ref.page}` : undefined}
          style={{ margin: 12 }}
        >
          {recipe.source.description}
          <Space block justify="end">
            <a href={recipe.source.link} target="_blank" rel="noreferrer">
              <Button>
                <Space>
                  <span>Learn more</span>
                  <FiExternalLink title="View on publisher website" />
                </Space>
              </Button>
            </a>
          </Space>
        </Card>
      );
      break;
    case 'youtube-channel':
      sourceBlock = (
        <Card
          title={
            <>
              <FiYoutube style={{ fontSize: '18px' }} /> {recipe.source.name}
            </>
          }
          extra={
            <a href={recipe.source.link} target="_blank" rel="noreferrer">
              <FiExternalLink style={{ fontSize: '18px' }} title="View on Youtube" />
            </a>
          }
          style={{ margin: 12 }}
        >
          {recipe.source.description}
        </Card>
      );
      break;
  }

  let attributionBlock;
  if (recipe.attributions.length > 0) {
    attributionBlock = (
      <List mode="card">
        {recipe.attributions.map((attribution) => (
          <AttributionLine key={attribution.source} attribution={attribution} />
        ))}
      </List>
    );
  }

  return (
    <>
      {recipe.refs.map((ref) => {
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
      {sourceBlock}
      {attributionBlock}
    </>
  );
}
