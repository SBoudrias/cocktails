import { describe, expect, it } from 'vitest';
import { createReport } from './report.ts';

describe('createReport', () => {
  it('starts with exit code 0', () => {
    const { getExitCode } = createReport();
    expect(getExitCode()).toBe(0);
  });

  it('marks the run failed on fail', () => {
    const { report, getExitCode } = createReport();
    report.fail('Validation failed for recipe.json');
    expect(getExitCode()).toBe(1);
  });

  it('stays successful on warn and change', () => {
    const { report, getExitCode } = createReport();
    report.warn('possible misspelling');
    report.change('Fixing name');
    expect(getExitCode()).toBe(0);
  });
});
