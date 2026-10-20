import { logger } from '../cli-util.ts';

export interface Report {
  /** Records a failure: logs it and marks the run as failed (exit code 1). */
  fail(message: string): void;
  warn(...messages: string[]): void;
  change(...messages: string[]): void;
}

/**
 * Collects check outcomes for a run: `fail` messages mark the run as failed,
 * `warn` and `change` are informational only.
 */
export function createReport(): { report: Report; getExitCode(): number } {
  let failed = false;

  const report: Report = {
    fail(message) {
      logger.error(message);
      failed = true;
    },
    warn(...messages) {
      logger.warn(...messages);
    },
    change(...messages) {
      logger.change(...messages);
    },
  };

  return { report, getExitCode: () => (failed ? 1 : 0) };
}
