'use client';
import { createTheme } from '@mui/material/styles';
import NextLink, { LinkProps } from 'next/link';
import { forwardRef, Ref } from 'react';

const LinkBehaviour = forwardRef(function LinkBehaviour(
  props: LinkProps,
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
  },
});

export default theme;
