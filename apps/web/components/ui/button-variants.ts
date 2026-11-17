import { cva } from 'class-variance-authority';

// Its own module: a component file exporting a non-component breaks Fast
// Refresh (react-doctor's only-export-components). Uppercase buttons; this
// theme sets no letter spacing on them.
//
// Only the variants the app's consumers use: `text` and `text-inherit` (the
// card-action link buttons) and `ghost` (the input-group's embedded stepper
// buttons). Sizes: the default row and the `icon-sm` stepper. Unused axes
// stay out until a consumer proves them.
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm leading-[1.75] font-medium whitespace-nowrap uppercase transition outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 not-aria-[haspopup]:active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        ghost: 'h-9 gap-1.5 px-2 hover:bg-muted hover:text-foreground',
        // The transparent text button the card actions use: h-9 + gap-1.5,
        // no border, icon spacing from the icon's own margins.
        text: 'h-9 min-w-16 gap-1.5 border-0 bg-transparent px-2 py-1.5 text-primary hover:bg-primary/8',
        // The moonlight-yellow text button the calculators' "Reset to
        // defaults" actions use. Natural height: 6px padding over the
        // 24.5px line box = 36.5px.
        'text-secondary':
          'min-w-16 gap-0 border-0 bg-transparent px-2 py-1.5 text-secondary hover:bg-secondary/8',
        // The card-action link buttons, on the same h-9 metrics as `text`.
        // A classless leading svg is the start-glyph recipe (the negative
        // margin pulls it into the button's own left padding, an optical
        // nudge for glyphs with empty viewBox edges) — the buttons don't
        // repeat it at every icon; an svg with size-* classes (the trailing
        // arrows) opts out, and the base's 20px rule sizes what's left.
        'text-inherit':
          "h-9 min-w-16 gap-1.5 border-0 bg-transparent px-2 py-1.5 hover:bg-foreground/8 [&_svg:not([class*='size-'])]:mr-2 [&_svg:not([class*='size-'])]:-ml-1",
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
