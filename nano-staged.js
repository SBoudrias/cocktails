export default {
  '*': 'oxfmt --no-error-on-unmatched-pattern',
  'packages/data/data/**/*.json': () => 'yarn check-data',
  '*.m?[jt]sx?': 'oxlint . --fix',
};
