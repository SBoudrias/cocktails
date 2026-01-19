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

// Tiki nighttime palette inspired by Harry Decker's "Secret Opening Night"
const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#1A8A8A', // Deep teal - moonlit atmosphere
          light: '#4DB8B8',
          dark: '#0E5C5C',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#E8A035', // Warm amber - tiki torch glow
          light: '#FFBE5C',
          dark: '#B87A1F',
          contrastText: '#000000',
        },
        background: {
          default: '#1E3D3D', // Deep teal to match beach image top
          paper: '#254949', // Slightly lighter teal for cards
        },
        text: {
          primary: '#E8F4F4', // Pale cyan-tinted white
          secondary: '#9DC4C4', // Muted teal
        },
        info: {
          main: '#7FD4D4', // Pale aqua - moonlight highlights
          light: '#B3E8E8',
          dark: '#4FA8A8',
        },
        success: {
          main: '#3D7A4F', // Forest green - jungle foliage
          light: '#5FA873',
          dark: '#2A5436',
        },
        warning: {
          main: '#D4883D', // Warm orange - torch glow variant
          light: '#EBAB6B',
          dark: '#A66628',
        },
        error: {
          main: '#C75B6D', // Muted coral - inspired by the lei
          light: '#E08A98',
          dark: '#9A3E4D',
        },
        divider: 'rgba(127, 212, 212, 0.12)', // Subtle teal divider
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
