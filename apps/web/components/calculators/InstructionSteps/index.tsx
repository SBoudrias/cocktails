// The section heading (20px/500/32px with its 7px bottom margin) above the
// instructions <ol>. The base layer strips list markers (no step numbers
// show), and the rows are 16px text under a 24px indent — the class sits on
// the <ol> so the items inherit it.
export function InstructionSteps({
  id,
  steps,
  className,
}: {
  /** The heading div's id; the <ol> labels itself with it. */
  id: string;
  steps: readonly string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div id={id} className="mb-1.75 text-xl leading-8 font-medium">
        Instructions
      </div>
      <ol aria-labelledby={id} className="pl-6 text-base">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
