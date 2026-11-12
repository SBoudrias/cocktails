import { createTheme } from '@mantine/core';

// Tiki nighttime palette, the same values as app/theme.tsx, in Mantine's
// 10-shade scales. `dark` drives the dark color scheme: [0] text,
// [2] dimmed text, [4] borders, [6] paper, [7] body.
const mantineTheme = createTheme({
  fontFamily: 'var(--font-roboto)',
  headings: { fontFamily: 'var(--font-roboto)' },
  primaryColor: 'tiki',
  primaryShade: 7,
  colors: {
    // Turquoise ocean water, #2A8A8A at [7]
    tiki: [
      '#e6f6f6',
      '#c4e8e8',
      '#9dd6d6',
      '#76c4c4',
      '#5dbdbd',
      '#46a6a6',
      '#389898',
      '#2a8a8a',
      '#1f7070',
      '#1a5a5a',
    ],
    dark: [
      '#e8f4f4', // Pale cyan-tinted white
      '#c9dede',
      '#9dc4c4', // Muted teal
      '#5e7f8a',
      '#2a3f52',
      '#1f3245',
      '#152535', // Slightly lighter for cards
      '#0a1420', // Dark starry night sky
      '#081019',
      '#050a10',
    ],
  },
});

export default mantineTheme;
