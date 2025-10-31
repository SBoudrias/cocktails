'use client';

import { useEffect, useRef } from 'react';
import { AppBar, IconButton, InputBase, Stack, Toolbar, Typography } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  marginRight: theme.spacing(1),
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: theme.spacing(4),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const ClearButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  padding: theme.spacing(0.5),
  marginRight: theme.spacing(0.5),
}));

export type ListSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string | null) => void;
  resultsCount: number;
  totalCount: number;
  isSearching: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  sticky?: boolean;
};

/**
 * Reusable search bar component for list pages
 */
export default function ListSearch({
  searchTerm,
  onSearchChange,
  resultsCount,
  totalCount,
  isSearching,
  placeholder = 'Search...',
  autoFocus = false,
  sticky = true,
}: ListSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search when focused
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        onSearchChange(null);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  const handleClear = () => {
    onSearchChange(null);
    searchInputRef.current?.focus();
  };

  return (
    <AppBar
      position={sticky ? 'sticky' : 'static'}
      color="default"
      elevation={1}
      sx={{ top: 0, zIndex: 1100 }}
    >
      <Toolbar>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Search sx={{ flex: 1, maxWidth: { xs: '100%', sm: 400 } }}>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              inputRef={searchInputRef}
              placeholder={placeholder}
              inputProps={{
                'aria-label': 'Search items',
                'aria-describedby': 'search-results-count',
              }}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value || null)}
              autoFocus={autoFocus}
              type="search"
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
            />
            {searchTerm && (
              <ClearButton size="small" onClick={handleClear} aria-label="Clear search">
                <ClearIcon fontSize="small" />
              </ClearButton>
            )}
          </Search>

          {/* Results counter */}
          <Typography
            id="search-results-count"
            variant="body2"
            color="text.secondary"
            sx={{
              display: { xs: 'none', sm: 'block' },
              minWidth: 120,
              textAlign: 'right',
            }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {isSearching ? `${resultsCount} results` : `${totalCount} items`}
          </Typography>

          {/* Keyboard hint */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: { xs: 'none', md: 'block' },
              opacity: 0.7,
            }}
          >
            ⌘K to search
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
