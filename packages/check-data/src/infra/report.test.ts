import { describe, expect, it } from 'vitest';
import { Report } from './report.ts';

describe('Report', () => {
  it('starts with exit code 0', () => {
    const report = new Report();
    expect(report.getExitCode()).toBe(0);
  });

  it('marks the run failed on fail', () => {
    const report = new Report();
    report.fail('Validation failed for recipe.json');
    expect(report.getExitCode()).toBe(1);
  });

  it('stays successful on warn and change', () => {
    const report = new Report();
    report.warn('possible misspelling');
    report.change('Fixing name');
    expect(report.getExitCode()).toBe(0);
  });

  it('keeps fail detachable from the instance', () => {
    const report = new Report();
    const fail = report.fail;
    fail('Invalid JSON in recipe.json');
    expect(report.getExitCode()).toBe(1);
  });
});
