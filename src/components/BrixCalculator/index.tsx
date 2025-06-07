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

export default function BrixCalculator({ sx }: { sx?: SxProps }) {
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>('');
  const [currentBrixValue, setCurrentBrix] = useState<string | number>(0);
  const [targetBrixValue, setTargetBrix] = useState<string | number>(50);

  const juiceWeight = parseFloat(juiceWeightValue as string);
  const currentBrix = parseFloat(currentBrixValue as string) || 0;
  const targetBrix = parseFloat(targetBrixValue as string);

  // Formula: sugar_weight = (juice_weight * (target_brix - current_brix)) / (100 - target_brix)
  const sugarWeight = (juiceWeight * (targetBrix - currentBrix)) / (100 - targetBrix);

  return (
    <Suspense>
      <Card sx={sx}>
        <CardHeader title="Sugar Adjusting" />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Juice weight"
                value={juiceWeightValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setJuiceWeight(event.target.value);
                }}
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
          </Stack>
        </CardContent>
      </Card>
    </Suspense>
  );
}
