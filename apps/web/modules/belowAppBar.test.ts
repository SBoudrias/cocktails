import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { belowAppBar } from './belowAppBar';

describe('belowAppBar', () => {
  it("offsets by the app bar's height at every breakpoint and orientation", () => {
    expect(belowAppBar(createTheme().mixins.toolbar)).toMatchInlineSnapshot(`
      {
        "@media (min-width:0px)": {
          "@media (orientation: landscape)": {
            "top": 48,
          },
        },
        "@media (min-width:600px)": {
          "top": 64,
        },
        "top": 56,
      }
    `);
  });
});
