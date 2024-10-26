'use client';

import { Attribution, Recipe } from '@/types/Recipe';
import { Source } from '@/types/Source';
import { Card, List, Space } from 'antd-mobile';
import { FiBook, FiYoutube, FiExternalLink } from 'react-icons/fi';
import Video from '@/components/Video';

function AttributionLine({ attribution }: { attribution: Attribution }) {
  switch (attribution.relation) {
    case 'recipe author':
      return (
        <List.Item>
          <span>Original recipe by&nbsp;</span>
          <a href={attribution.url} target="_blank" rel="noreferrer">
            <Space>
              <b>{attribution.source}</b>
              <FiExternalLink
                style={{ fontSize: '18px' }}
                title="View on publisher website"
              />
            </Space>
          </a>
        </List.Item>
      );
    case 'adapted by':
      return (
        <List.Item>
          <span>Adapted by&nbsp;</span>
          <a href={attribution.url} target="_blank" rel="noreferrer">
            <Space>
              <b>{attribution.source}</b>
              <FiExternalLink
                style={{ fontSize: '18px' }}
                title="View on publisher website"
              />
            </Space>
          </a>
        </List.Item>
      );
    case 'bar':
      return (
        <List.Item>
          <span>Bar:&nbsp;</span>
          <a href={attribution.url} target="_blank" rel="noreferrer">
            <Space>
              <b>{attribution.source}</b>
              <FiExternalLink
                style={{ fontSize: '18px' }}
                title="View on publisher website"
              />
            </Space>
          </a>
        </List.Item>
      );
  }
}

export default function RecipeSources({
  source,
  recipe,
}: {
  source: Source;
  recipe: Recipe;
}) {
  let sourceBlock;
  switch (source.type) {
    case 'book':
      sourceBlock = (
        <Card
          title={
            <>
              <FiBook style={{ fontSize: '18px' }} /> {source.name}
            </>
          }
          extra={
            <a href={source.link} target="_blank" rel="noreferrer">
              <FiExternalLink
                style={{ fontSize: '18px' }}
                title="View on publisher website"
              />
            </a>
          }
          style={{ margin: 12 }}
        >
          {source.description}
        </Card>
      );
      break;
    case 'youtube-channel':
      sourceBlock = (
        <Card
          title={
            <>
              <FiYoutube style={{ fontSize: '18px' }} /> {source.name}
            </>
          }
          extra={
            <a href={source.link} target="_blank" rel="noreferrer">
              <FiExternalLink style={{ fontSize: '18px' }} title="View on Youtube" />
            </a>
          }
          style={{ margin: 12 }}
        >
          {source.description}
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
