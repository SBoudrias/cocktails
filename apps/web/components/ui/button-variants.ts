import { cva } from 'class-variance-authority';

// Its own module: a component file exporting a non-component breaks Fast
// Refresh (react-doctor's only-export-components). Uppercase like MUI's
// buttons; this theme sets no letter spacing on them (probed `normal` on
// every button the app renders, unlike MUI's default typography).
//
// Only the variants the migration's consumers use: `text` and `text-inherit`
// (MUI's variant=text, the card-action link buttons) and `ghost` (the
// input-group's embedded stepper buttons). Sizes: the default row and the
// `icon-sm` stepper. The unused shadcn axes stay out until a consumer
// proves them.
export const buttonVariants = cva(
  "uppercase group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium leading-[1.75] whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        ghost: 'h-9 gap-1.5 px-2 hover:bg-muted hover:text-foreground',
        // MUI's variant=text: the transparent text button the app's card
        // actions use. h-9 + gap-1.5 (not MUI's natural 36.5px) — the
        // surfaces family landed these metrics in #587 and the pages family
        // gated against them; they are the merged standard. No border, and
        // icon spacing comes from the icon's own margins.
        text: 'h-9 gap-1.5 min-w-16 border-0 bg-transparent px-2 py-1.5 text-primary hover:bg-primary/8',
        // MUI's variant=text color=secondary: the moonlight-yellow text
        // button the calculators' "Reset to defaults" actions use. Natural
        // height — MUI's text button is 6px padding over the 24.5px line
        // box = 36.5px (probed; the brix/saline gate is 0.00 at this size).
        'text-secondary':
          'gap-0 min-w-16 border-0 bg-transparent px-2 py-1.5 text-secondary hover:bg-secondary/8',
        // MUI's variant=text color=inherit: the card-action link buttons,
        // on the family's h-9 metrics.
        'text-inherit':
          'h-9 gap-1.5 min-w-16 border-0 bg-transparent px-2 py-1.5 hover:bg-foreground/8',
      },
      // twMerge resolves conflicts by composition order (base, variant, size,
      // className), so the size axis only carries what no variant sets:
      // the default is bare (every current consumer passes a variant), and
      // icon-sm pairs with ghost for the input-group's steppers.
      size: {
        default: '',
        'icon-sm': 'size-7 rounded-[min(var(--radius-md),12px)]',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default',
    },
  },
);
