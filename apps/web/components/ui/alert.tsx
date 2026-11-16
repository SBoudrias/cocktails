import { cn } from 'cn';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { match } from 'ts-pattern';

// MUI's Alert, standard variant, dark mode (probed on the baseline): body2
// metrics on a 4px-radius block of darken(<channel>.light, 0.9) with
// 6px/16px padding, its text lighten(<channel>.light, 0.6); the icon column
// is <channel>.main (22px glyphs at 90% opacity, 12px right margin, 7px
// vertical padding) and the message 8px vertical padding. The two computed
// colors MUI derived from its palette stay as literal hexes (they are not
// theme tokens); the icons carry the tokens. The glyphs are lucide's
// (stroke, not MUI's fills) — the accepted icon-rule trade.
export function Alert({
  severity,
  children,
}: {
  severity: 'warning' | 'error';
  children: React.ReactNode;
}) {
  const { rootClass, iconClass, Icon } = match(severity)
    .with('warning', () => ({
      rootClass: 'text-[#F7DDC3] bg-[#17110A]',
      iconClass: 'text-(--warning)',
      Icon: TriangleAlert,
    }))
    .with('error', () => ({
      rootClass: 'text-[#E9D0DA] bg-[#140D10]',
      iconClass: 'text-destructive',
      Icon: CircleAlert,
    }))
    .exhaustive();

  return (
    <div role="alert" className={cn('flex rounded-sm px-4 py-1.5 text-sm', rootClass)}>
      <div
        aria-hidden="true"
        className={cn(
          'mr-3 flex py-[7px] text-[22px] leading-none opacity-90',
          iconClass,
        )}
      >
        <Icon className="size-[22px]" />
      </div>
      <div className="min-w-0 overflow-auto py-2">{children}</div>
    </div>
  );
}
