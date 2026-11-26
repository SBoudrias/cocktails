import Link from 'next/link';
import { siGithub } from 'simple-icons';
import BrandIcon from '#/components/icons/BrandIcon';
import TikiMark from '#/components/TikiMark';

// The footer: the two brand links pulled to the bottom edge of a tall flex
// row — Indexotica's home on the left, the GitHub link on the right.
export default function AppFooter() {
  return (
    <div className="flex min-h-[350px] items-end justify-between p-4">
      <Link href="/" className="flex items-center gap-1 text-foreground">
        <TikiMark /> Indexotica
      </Link>
      <a
        href="https://github.com/SBoudrias/cocktails/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-foreground"
      >
        <BrandIcon icon={siGithub} size="lg" /> Contribute on GitHub
      </a>
    </div>
  );
}
