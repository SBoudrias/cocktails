'use client';

import { NavBar } from 'antd-mobile';
import { SearchOutline } from 'antd-mobile-icons';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  return (
    <NavBar
      back={isHome ? null : undefined}
      onBack={() => router.back()}
      right={
        <Link href="/">
          <SearchOutline fontSize={24} />
        </Link>
      }
    >
      {title}
    </NavBar>
  );
}
