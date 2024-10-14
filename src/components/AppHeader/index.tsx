'use client';

import { NavBar } from 'antd-mobile';
import { useRouter, usePathname } from 'next/navigation';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  return (
    <NavBar back={isHome ? null : undefined} onBack={() => router.back()}>
      {title}
    </NavBar>
  );
}
