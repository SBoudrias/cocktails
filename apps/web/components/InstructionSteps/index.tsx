// MUI's Typography variant=h6 with gutterBottom (20px/500/32px, the 0.35em
// = 7px bottom margin) above the instructions <ol>. The base layer strips
// list markers (probed on the baseline: MUI's CssBaseline never restored
// them, so no step numbers show), and the rows are body1 16px text under
// MUI's Box pl: 3 (24px indent) — the class once on the <ol> so the items
// inherit it.
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
      <div id={id} className="mb-[7px] text-xl leading-8 font-medium">
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
