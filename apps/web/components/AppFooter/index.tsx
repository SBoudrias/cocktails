import Link from 'next/link';
import GitHubIcon from '#/components/icons/GitHubIcon';
import TikiMark from '#/components/TikiMark';

// The footer: the two brand links pulled to the bottom edge of a tall flex
// row — Indexotica's home on the left, the GitHub link on the right. The
// mark sits in the link's baseline flow next to its word, optically centered
// with the text like any inline svg (text-top alignment).
export default function AppFooter() {
  return (
    <div className="flex min-h-[350px] flex-row items-end justify-between px-4 py-4">
      <Link href="/" className="flex items-center gap-1 text-white">
        <TikiMark /> Indexotica
      </Link>
      <a
        href="https://github.com/SBoudrias/cocktails/"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-1 text-white"
      >
        <GitHubIcon /> Contribute on GitHub
      </a>
    </div>
  );
}
