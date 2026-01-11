'use client';

import type { SxProps } from '@mui/material';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Suspense, useState } from 'react';

export default function BrixCalculator({ sx }: { sx?: SxProps }) {
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>('');
  const [currentBrixValue, setCurrentBrix] = useState<string | number>(0);
  const [targetBrixValue, setTargetBrix] = useState<string | number>(50);

  const juiceWeight = parseFloat(juiceWeightValue as string);
  const currentBrix = parseFloat(currentBrixValue as string) || 0;
  const targetBrix = parseFloat(targetBrixValue as string);

  const isTargetBrixValid = !isNaN(targetBrix) && targetBrix < 100;
  const isCurrentBrixValid =
    !isNaN(currentBrix) && currentBrix < targetBrix && currentBrix < 100;

  // Formula: sugar_weight = (juice_weight * (target_brix - current_brix)) / (100 - target_brix)
  const sugarWeight =
    isTargetBrixValid && isCurrentBrixValid
      ? (juiceWeight * (targetBrix - currentBrix)) / (100 - targetBrix)
      : NaN;

  return (
    <Suspense>
      <Card sx={sx}>
        <CardHeader title="Sugar Adjusting" />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="top">
              <TextField
                label="Juice weight"
                value={juiceWeightValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setJuiceWeight(event.target.value);
                }}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Juice Brix"
                value={currentBrixValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setCurrentBrix(event.target.value);
                }}
                error={!isCurrentBrixValid}
                helperText={
                  !isCurrentBrixValid
                    ? currentBrix >= 100
                      ? 'Must be less than 100'
                      : 'Must be lower than target Brix'
                    : ''
                }
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">brix</InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Target Brix"
                value={targetBrixValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setTargetBrix(event.target.value);
                }}
                error={!isTargetBrixValid}
                helperText={!isTargetBrixValid ? 'Must be less than 100' : ''}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">brix</InputAdornment>,
                  },
                }}
              />
            </Stack>
            <TextField
              label="Sugar to add"
              value={
                isNaN(sugarWeight)
                  ? ''
                  : `${sugarWeight.toLocaleString('en', { maximumFractionDigits: 2 })}`
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
                  setJuiceWeight('');
                  setCurrentBrix(0);
                  setTargetBrix(50);
                }}
              >
                Reset to defaults
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Note: Use a refractometer to measure the current Brix level of your juice.
              Place a few drops of juice on the refractometer&apos;s prism, close the
              cover, and read the Brix value through the eyepiece.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Degrees Brix (symbol °Bx) is a measure of the dissolved solids in a liquid.
              It is commonly used to measure dissolved sugar content of a solution. One
              degree Brix is 1 gram of sucrose solute dissolved in 100 grams of solution
              and represents the strength of the solution as percentage by mass.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Suspense>
  );
}
