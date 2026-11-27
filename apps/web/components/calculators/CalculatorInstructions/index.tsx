import type { ReactNode } from 'react';
import { List, ListRow, ListSubheader } from '#/components/ui/list';

/**
 * The numbered instructions the technique calculators render below their
 * card: a subheader above a surface block of divider rows, each row numbered
 * like a recipe's steps. Optional `controls` render directly above the steps
 * list (e.g. a technique toggle that only affects the instructions).
 */
export function CalculatorInstructions({
  steps,
  controls,
}: {
  steps: readonly string[];
  controls?: ReactNode;
}) {
  return (
    <section aria-label="Instructions">
      <List>
        <li>
          <ListSubheader>Instructions</ListSubheader>
          {controls && <div className="flex flex-col gap-4 px-4 pb-3">{controls}</div>}
          <ul className="surface">
            {steps.map((step, index) => (
              <ListRow key={step}>
                <span className="my-1 flex-1 text-left">
                  {index + 1}. {step}
                </span>
              </ListRow>
            ))}
          </ul>
        </li>
      </List>
    </section>
  );
}
