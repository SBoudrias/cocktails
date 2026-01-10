'use client';

import { useRef } from 'react';
import { Button, InputBase, Stack } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
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
  height: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

type SearchInputProps = {
  value: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack direction="row" sx={{ flexGrow: 1 }}>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          ref={inputRef}
          placeholder={placeholder}
          inputProps={{ 'aria-label': 'search' }}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          type="search"
          autoFocus={autoFocus}
          onKeyUp={(e) => {
            if (e.code === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </Search>
      <Button
        type="reset"
        onClick={() => {
          onChange(null);
          inputRef.current?.querySelector('input')?.focus();
        }}
      >
        Clear
      </Button>
    </Stack>
  );
}
