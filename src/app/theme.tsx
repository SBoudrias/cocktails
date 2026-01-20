'use client';
import type { LinkProps } from 'next/link';
import type { Ref } from 'react';
import { createTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import { forwardRef } from 'react';

const LinkBehaviour = forwardRef(function LinkBehaviour(
  props: LinkProps,
  ref: Ref<HTMLAnchorElement>,
) {
  return <NextLink ref={ref} {...props} />;
});

// Tiki nighttime palette inspired by tropical night scene
const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#2A8A8A', // Turquoise ocean water
          light: '#5DBDBD',
          dark: '#1A5A5A',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#E8B84D', // Warm moonlight glow
          light: '#FFD580',
          dark: '#C89A2F',
          contrastText: '#000000',
        },
        background: {
          default: '#0A1420', // Dark starry night sky
          paper: '#152535', // Slightly lighter for cards
        },
        text: {
          primary: '#E8F4F4', // Pale cyan-tinted white
          secondary: '#9DC4C4', // Muted teal
        },
        info: {
          main: '#5DB8D8', // Bright turquoise highlights
          light: '#8DD4ED',
          dark: '#3A8AA8',
        },
        success: {
          main: '#3D7A4F', // Forest green - palm foliage
          light: '#5FA873',
          dark: '#2A5436',
        },
        warning: {
          main: '#D4883D', // Warm orange accent
          light: '#EBAB6B',
          dark: '#A66628',
        },
        error: {
          main: '#A85B7A', // Magenta purple from palm silhouettes
          light: '#C98AA3',
          dark: '#7A3E5A',
        },
        divider: 'rgba(93, 184, 216, 0.12)', // Subtle turquoise divider
      },
    },
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehaviour,
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehaviour,
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          ':last-child': {
            paddingBottom: 16,
          },
          '+ .MuiCardActions-root': {
            paddingTop: 0,
          },
          '+ .MuiCardContent-root': {
            paddingTop: 0,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          '+ .MuiCardContent-root': {
            paddingTop: 0,
          },
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          lineHeight: '1.4rem',
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: 'var(--mui-palette-background-default)',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          textTransform: 'capitalize',
        },
      },
    },
  },
});

export default theme;
