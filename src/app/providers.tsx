'use client';
import { useRouter } from 'next/navigation';
import { NextUIProvider } from '@nextui-org/react';
import { ConfigProvider } from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <ConfigProvider locale={enUS}>
      <NextUIProvider navigate={router.push}>{children}</NextUIProvider>
    </ConfigProvider>
  );
}
