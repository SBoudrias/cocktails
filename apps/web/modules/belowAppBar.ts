import type { CSSObject } from '@mui/material/styles';

/**
 * The `top` offset that puts a sticky element right below the fixed app bar:
 * MUI's toolbar mixin (the app bar's height, per breakpoint and orientation)
 * with each `minHeight` turned into a `top`.
 */
export function belowAppBar(toolbar: CSSObject): CSSObject {
  return Object.fromEntries(
    Object.entries(toolbar).map(([key, value]) => {
      if (key === 'minHeight') return ['top', value];
      if (isNestedStyle(value)) return [key, belowAppBar(value)];
      return [key, value];
    }),
  );
}

// A media query's block of styles, like the mixin's per-breakpoint heights.
function isNestedStyle(value: unknown): value is CSSObject {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
