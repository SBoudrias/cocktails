'use client';

import { TextField, Stack, Typography } from '@mui/material';
import { ChangeEvent } from 'react';

interface ServingSelectorProps {
  currentServings: number;
  defaultServings: number;
  onChange: (servings: number) => void;
}

export default function ServingSelector({
  currentServings,
  defaultServings,
  onChange,
}: ServingSelectorProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);

    // Validate input: must be a positive integer between 1 and 50
    if (!isNaN(value) && value >= 1 && value <= 50) {
      onChange(value);
    } else if (event.target.value === '') {
      // Allow empty input temporarily, but don't call onChange
      return;
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);

    // If invalid input on blur, reset to current valid value
    if (isNaN(value) || value < 1 || value > 50) {
      event.target.value = currentServings.toString();
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" component="label" htmlFor="serving-selector">
        Servings:
      </Typography>
      <TextField
        id="serving-selector"
        type="number"
        size="small"
        value={currentServings}
        onChange={handleChange}
        onBlur={handleBlur}
        inputProps={{
          min: 1,
          max: 50,
          'aria-label': 'Number of servings',
          style: { width: '60px', textAlign: 'center' },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: '32px',
          },
        }}
      />
      {currentServings !== defaultServings && (
        <Typography variant="caption" color="text.secondary">
          (recipe default: {defaultServings})
        </Typography>
      )}
    </Stack>
  );
}
