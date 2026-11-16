// lucide-react ships no brand logos (removed in its 1.x line), so the two
// brand marks the app needs come from simple-icons. The wrapper keeps the
// 24px default and the same a11y handling; the glyph itself is the
// library's, not our own.
import { siGithub } from 'simple-icons';

export default function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
      <path d={siGithub.path} />
    </svg>
  );
}
