'use client';
import type { LinkProps } from 'next/link';
import type { Ref } from 'react';
import { createTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import { forwardRef } from 'react';

const LinkBehaviour = forwardRef(function LinkBehaviour(
  props: LinkProps<string>,
  ref: Ref<HTMLAnchorElement>,
) {
  return <NextLink ref={ref} {...props} />;
});

const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  colorSchemes: {
    dark: true,
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
