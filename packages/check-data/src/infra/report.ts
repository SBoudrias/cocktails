import { logger } from '../cli-util.ts';

/**
 * Collects check outcomes for a run: `fail` messages mark the run as failed
 * (exit code 1), `warn` and `change` are informational only.
 */
export class Report {
  #failed = false;

  /** Records a failure: logs it and marks the run as failed (exit code 1). */
  fail = (message: string): void => {
    logger.error(message);
    this.#failed = true;
  };

  warn = (...messages: string[]): void => {
    logger.warn(...messages);
  };

  change = (...messages: string[]): void => {
    logger.change(...messages);
  };

  getExitCode(): number {
    return this.#failed ? 1 : 0;
  }
}
