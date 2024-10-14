'use client';

import { Footer } from 'antd-mobile';

export default function AppFooter() {
  return (
    <Footer
      content="Cocktail Index"
      links={[
        {
          text: 'Contribute on GitHub',
          href: 'https://github.com/SBoudrias/cocktails/',
        },
      ]}
      style={{ marginTop: '12px' }}
    />
  );
}
