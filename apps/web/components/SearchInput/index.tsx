'use client';

import { Search } from 'lucide-react';
import { useRef } from 'react';

// The searchbox as MUI styled it: a relative rounded field with the glassy
// white/15 fill (white/25 hovered), the magnifier absolutely parked on the
// left (pointer-events off), and the input padded 8px with its 48px left pad
// spanning the icon. The Clear button is MUI's text button: uppercase 14px
// 500, 6px 8px padding in a 64px-min row, primary colored, stretching to
// the input's height.
export default function SearchInput({
  value,
  onChangeAction,
  placeholder = 'Search…',
  autoFocus = false,
  onFocusAction,
}: {
  value: string;
  onChangeAction: (value: string | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocusAction?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex grow items-center">
      <div className="relative w-full rounded-[var(--radius)] bg-foreground/15 hover:bg-foreground/25">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center px-4">
          <Search aria-hidden="true" className="size-[1.5em]" />
        </div>
        <input
          ref={inputRef}
          type="search"
          aria-label="search"
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onFocus={onFocusAction}
          onChange={(e) => onChangeAction(e.currentTarget.value)}
          onKeyUp={(e) => {
            if (e.code === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          className="w-full border-0 bg-transparent py-2 pl-[calc(1em+2rem)] pr-2 font-sans text-base text-foreground caret-foreground outline-none placeholder:text-foreground/50 [&::-webkit-search-decoration]:-webkit-appearance-none"
        />
      </div>
      <button
        type="reset"
        onClick={() => {
          onChangeAction(null);
          inputRef.current?.focus();
        }}
        className="h-full min-w-16 shrink-0 self-stretch rounded-[var(--radius)] px-2 py-1.5 text-sm font-medium uppercase tracking-normal text-primary outline-none"
      >
        Clear
      </button>
    </div>
  );
}
