'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  SxProps,
  TextField,
} from '@mui/material';
import { Suspense, useState } from 'react';

export default function SalineCalculator({ sx }: { sx?: SxProps }) {
  const [waterWeightValue, setWaterWeight] = useState<string | number>(80);
  const [salinityValue, setSalinity] = useState<string | number>(20);

  const waterWeight = parseFloat(waterWeightValue as string);
  const salinity = parseFloat(salinityValue as string);

  const isSalinityValid = !isNaN(salinity) && salinity > 0 && salinity < 100;
  const isWaterWeightValid = !isNaN(waterWeight) && waterWeight > 0;

  // Formula: S = (P/100 * W) / (1 - P/100)
  const saltWeight =
    isSalinityValid && isWaterWeightValid
      ? ((salinity / 100) * waterWeight) / (1 - salinity / 100)
      : NaN;

  return (
    <Suspense>
      <Card sx={sx}>
        <CardHeader title="Saline Solution Calculator" />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="top">
              <TextField
                label="Water weight"
                value={waterWeightValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setWaterWeight(event.target.value);
                }}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Target Salinity %"
                value={salinityValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSalinity(event.target.value);
                }}
                error={!isSalinityValid}
                helperText={!isSalinityValid ? 'Must be between 0 and 100' : ''}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
              />
            </Stack>
            <TextField
              label="Salt to add"
              value={
                isNaN(saltWeight)
                  ? ''
                  : `${saltWeight.toLocaleString('en', { maximumFractionDigits: 2 })}`
              }
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                color="secondary"
                onClick={() => {
                  setWaterWeight('');
                  setSalinity(20);
                }}
              >
                Reset to defaults
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Suspense>
  );
}
