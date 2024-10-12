'use client';
import { ConfigProvider } from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConfigProvider locale={enUS}>{children}</ConfigProvider>;
}
