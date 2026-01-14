'use client';

import type { ChangeEvent } from 'react';
import { Add, Remove } from '@mui/icons-material';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { useState, useEffect } from 'react';

export default function ServingSelector({
  servings,
  onChange,
}: {
  servings: number;
  onChange: (servings: number) => void;
}) {
  const [inputValue = servings.toString(), setInputValue] = useState<
    string | undefined
  >();

  // Update input value when servings prop changes (from button clicks or external changes)
  useEffect(() => {
    setInputValue(undefined);
  }, [servings]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newInputValue = event.target.value;
    setInputValue(newInputValue);

    // Only trigger onChange if the value is valid
    if (newInputValue !== '') {
      const value = parseFloat(newInputValue);
      if (!isNaN(value) && value > 0 && value <= 50) {
        onChange(value);
        setInputValue(undefined);
      }
    }
  };

  const handleIncrement = () => {
    setInputValue(undefined);

    if (servings < 50) {
      if (servings < 1) {
        // From fractional values, go to 1
        onChange(1);
      } else {
        // From 1 or above, increment by 1
        onChange(servings + 1);
      }
    }
  };

  const handleDecrement = () => {
    setInputValue(undefined);

    // At 0.25, button will be disabled
    if (servings > 0.25) {
      if (servings > 1) {
        onChange(servings - 1);
      } else if (servings > 0.5) {
        onChange(0.5);
      } else {
        onChange(0.25);
      }
    }
  };

  const handleBlur = () => {
    setInputValue(undefined);
  };

  return (
    <TextField
      type="number"
      size="small"
      label="Servings"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                onClick={handleDecrement}
                disabled={servings <= 0.25}
                size="small"
                aria-label="Decrement"
              >
                <Remove fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleIncrement}
                disabled={servings >= 50}
                size="small"
                aria-label="Increment"
              >
                <Add fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
        htmlInput: {
          min: 0,
          max: 50,
          step: 1,
          'aria-label': 'Number of servings',
        },
      }}
    />
  );
}
