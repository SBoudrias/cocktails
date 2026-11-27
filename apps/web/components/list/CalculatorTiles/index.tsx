import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from '@ui-sdk/react/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import CalculatorIcon from './CalculatorIcon';
import styles from './style.module.css';

// Six tiles per carousel page; juice clarification sits on the second page as
// the least used calculator.
const CALCULATORS = [
  {
    slug: 'acid-adjusting',
    label: 'Acid Adjusting',
  },
  {
    slug: 'brix',
    label: 'Brix',
  },
  {
    slug: 'fat-wash',
    label: 'Fat Wash',
  },
  {
    slug: 'milk-clarification',
    label: 'Milk Clarification',
  },
  {
    slug: 'saline',
    label: 'Saline',
  },
  {
    slug: 'super-juice',
    label: 'Super Juice',
  },
  {
    slug: 'juice-clarification',
    label: 'Juice Clarification',
  },
] as const;

const PAGE_SIZE = 6;

const PAGES = Array.from(
  { length: Math.ceil(CALCULATORS.length / PAGE_SIZE) },
  (_, index) => CALCULATORS.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE),
);

const controlClass =
  'cursor-pointer rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:opacity-35';

export default function CalculatorTiles() {
  return (
    <Carousel
      aria-label="Calculators"
      // items-stretch: web.css's centered grid tracks would shrink the viewport.
      className="flex w-full max-w-none flex-col items-stretch gap-1"
    >
      <CarouselViewport>
        <CarouselContent className="gap-0">
          {PAGES.map((page, pageIndex) => (
            <CarouselItem key={page[0]!.slug}>
              <ul
                className={styles.grid}
                aria-label={`Calculators page ${pageIndex + 1}`}
              >
                {page.map((calculator) => (
                  <li key={calculator.slug}>
                    <Link
                      href={{ pathname: `/calculators/${calculator.slug}` }}
                      className={styles.tile}
                    >
                      <CalculatorIcon calculator={calculator.slug} />
                      <span className={styles.label}>{calculator.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CarouselItem>
          ))}
        </CarouselContent>
      </CarouselViewport>
      <div className="flex items-center justify-center gap-2 pb-1">
        <CarouselPrevious aria-label="Previous calculators" className={controlClass}>
          <ChevronLeft />
        </CarouselPrevious>
        <CarouselIndicatorGroup
          aria-label="Choose a calculator page"
          className="items-center gap-2"
        >
          {PAGES.map((page, index) => (
            <CarouselIndicator
              key={page[0]!.slug}
              page={index + 1}
              aria-label={`Calculators page ${index + 1}`}
              className="size-3 rounded-full border-2 border-transparent bg-foreground/30 p-0 hover:bg-foreground/50 data-selected:border-primary data-selected:bg-primary data-selected:hover:bg-primary"
            />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNext aria-label="Next calculators" className={controlClass}>
          <ChevronRight />
        </CarouselNext>
      </div>
    </Carousel>
  );
}
