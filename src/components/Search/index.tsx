'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FloatingPanel,
  SearchBar,
  Space,
  List,
  type FloatingPanelRef,
} from 'antd-mobile';
import { SoundOutline } from 'antd-mobile-icons';
import styles from './style.module.css';

const results = [
  {
    icon: <SoundOutline />,
    name: 'Mai tai',
    href: '/recipes/mai-tai',
  },
];

export default function Search() {
  const router = useRouter();
  const panelRef = useRef<FloatingPanelRef>(null);
  const anchors = [72, 72 + 119, (globalThis.innerHeight ?? 1000) - 45];

  return (
    <>
      {/* Spacing div to ensure there's no content hidden by the floating panel */}
      <div style={{ height: anchors[0] }}></div>
      <FloatingPanel anchors={anchors} ref={panelRef}>
        <Space block className={styles.search}>
          <SearchBar
            placeholder="Search for a recipe or an ingredient"
            showCancelButton
            onFocus={() => {
              panelRef.current?.setHeight(anchors[2], { immediate: true });
            }}
            onBlur={() => {
              panelRef.current?.setHeight(anchors[0]);
            }}
          />
        </Space>

        <List header="Results">
          {results.map((item) => (
            <List.Item
              prefix={item.icon}
              key={item.name}
              onClick={() => router.push(item.href)}
            >
              {item.name}
            </List.Item>
          ))}
        </List>
      </FloatingPanel>
    </>
  );
}
