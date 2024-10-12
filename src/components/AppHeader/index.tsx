'use client';

import { NavBar } from 'antd-mobile';
import { useRouter, usePathname } from 'next/navigation';

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  return (
    <NavBar back={isHome ? null : undefined} onBack={() => router.push('/')}>
      Cocktail Index
    </NavBar>
  );
}
