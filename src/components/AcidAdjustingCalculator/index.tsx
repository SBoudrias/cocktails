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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Suspense, useState } from 'react';
import Video from '@/components/Video';
import { useSearchParams } from 'next/navigation';

const LIME_ACIDITY = 6;

function ClassicalCalculator({ defaultAcidity }: { defaultAcidity: number }) {
  const [targetAcidityValue, setTargetAcidity] = useState<string | number>(LIME_ACIDITY);
  const [acidAmountValue, setAcidAmount] = useState<string | number>(defaultAcidity);
  const [weightValue, setWeight] = useState<string | number>(100);

  const targetAcidity = parseFloat(targetAcidityValue as string);
  const acidAmount = parseFloat(acidAmountValue as string);
  const weight = parseFloat(weightValue as string);

  // 2/3 citric, 1/3 malic
  // We're assuming the acid content of the juice is only citric which is why we remove it from
  // our citric target. This is almost always the case, warranting this slight simplification.
  const targetCitric = targetAcidity * (2 / 3) - acidAmount;
  const targetMalic = targetAcidity * (1 / 3);

  const citricAcid = (targetCitric * weight) / 100;
  const malicAcid = (targetMalic * weight) / 100;

  return (
    <>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Juice weight"
              value={weightValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setWeight(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Juice acidity"
              value={acidAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAcidAmount(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Target acidity"
              value={targetAcidityValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTargetAcidity(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
          </Stack>
          <span>Mix & dilute into juice:</span>
          <TextField
            label="Citric Acid"
            value={
              isNaN(citricAcid)
                ? ''
                : `${citricAcid.toLocaleString('en', { maximumFractionDigits: 2 })}`
            }
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: <InputAdornment position="end">grams</InputAdornment>,
              },
            }}
          />
          <TextField
            label="Malic Acid"
            value={
              isNaN(malicAcid)
                ? ''
                : `${malicAcid.toLocaleString('en', { maximumFractionDigits: 2 })}`
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
                setTargetAcidity(LIME_ACIDITY);
                setAcidAmount(defaultAcidity);
                setWeight(100);
              }}
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </>
  );
}

function AcidAdjusterCalculator({ defaultAcidity }: { defaultAcidity: number }) {
  const searchParams = useSearchParams();
  const defaultJuiceAmount = parseFloat(searchParams.get('juiceAmount') as string);

  const [juiceAmountValue, setJuiceAmount] = useState<string | number>(
    isNaN(defaultJuiceAmount) ? 1 : defaultJuiceAmount,
  );
  const [targetAcidityValue, setTargetAcidity] = useState<string | number>(LIME_ACIDITY);
  const [acidAmountValue, setAcidAmount] = useState<string | number>(defaultAcidity);

  const juiceAmount = parseFloat(juiceAmountValue as string);
  const targetAcidity = parseFloat(targetAcidityValue as string);
  const acidAmount = parseFloat(acidAmountValue as string);
  const diff = juiceAmount * (targetAcidity - acidAmount);

  return (
    <>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Juice amount"
              value={juiceAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setJuiceAmount(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">oz</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Juice acidity"
              value={acidAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAcidAmount(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Target acidity"
              value={targetAcidityValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTargetAcidity(event.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
              }}
            />
          </Stack>
          <TextField
            label="Acid adjuster to add"
            value={
              isNaN(diff)
                ? ''
                : `${diff.toLocaleString('en', { maximumFractionDigits: 2 })}`
            }
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: <InputAdornment position="end">ml</InputAdornment>,
              },
            }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              color="secondary"
              onClick={() => {
                setTargetAcidity(LIME_ACIDITY);
                setAcidAmount(defaultAcidity);
              }}
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <CardContent>
        <Video id="8pFBK0KWkNc" />
      </CardContent>
    </>
  );
}

export default function AcidAdjustingCalculator({
  defaultAcidity,
  sx,
}: {
  defaultAcidity: number;
  sx?: SxProps;
}) {
  const [type, setType] = useState<'powder' | 'acid-adjuster'>('acid-adjuster');

  return (
    <Suspense>
      <Card sx={sx}>
        <CardHeader
          title="Acid Adjusting"
          action={
            <ToggleButtonGroup
              value={type}
              onChange={(_, newVal) =>
                setType(newVal === 'powder' ? 'powder' : 'acid-adjuster')
              }
              size="small"
              aria-label="Preferred acid-adjusting technique"
              exclusive
            >
              <ToggleButton value="acid-adjuster">Solution</ToggleButton>
              <ToggleButton value="powder">Powder</ToggleButton>
            </ToggleButtonGroup>
          }
          sx={{
            pb: 3,
          }}
        />
        {type === 'powder' ? (
          <ClassicalCalculator defaultAcidity={defaultAcidity} />
        ) : (
          <AcidAdjusterCalculator defaultAcidity={defaultAcidity} />
        )}
      </Card>
    </Suspense>
  );
}
