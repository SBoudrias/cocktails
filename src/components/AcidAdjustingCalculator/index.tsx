'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useState } from 'react';
import Video from '@/components/Video';

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
              label="Target %"
              value={targetAcidityValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTargetAcidity(event.target.value);
              }}
            />
            <TextField
              label="Juice %"
              value={acidAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAcidAmount(event.target.value);
              }}
            />
            <TextField
              label="Juice weight (grams)"
              value={weightValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setWeight(event.target.value);
              }}
            />
          </Stack>
          <span>Mix & dilute into juice:</span>
          <TextField
            label="Citric Acid"
            value={
              isNaN(citricAcid)
                ? ''
                : `${citricAcid.toLocaleString('en', { maximumFractionDigits: 2 })} grams`
            }
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <TextField
            label="Malic Acid"
            value={
              isNaN(malicAcid)
                ? ''
                : `${malicAcid.toLocaleString('en', { maximumFractionDigits: 2 })} grams`
            }
            slotProps={{
              input: {
                readOnly: true,
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
  const [targetAcidityValue, setTargetAcidity] = useState<string | number>(LIME_ACIDITY);
  const [acidAmountValue, setAcidAmount] = useState<string | number>(defaultAcidity);

  const targetAcidity = parseFloat(targetAcidityValue as string);
  const acidAmount = parseFloat(acidAmountValue as string);
  const diff = targetAcidity - acidAmount;

  return (
    <>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Target %"
              value={targetAcidityValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTargetAcidity(event.target.value);
              }}
            />
            <span>-</span>
            <TextField
              label="Juice %"
              value={acidAmountValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAcidAmount(event.target.value);
              }}
            />
            <span>=</span>
            <TextField
              value={
                isNaN(diff)
                  ? ''
                  : `${diff.toLocaleString('en', { maximumFractionDigits: 2 })} ml`
              }
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </Stack>
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
}: {
  defaultAcidity: number;
}) {
  const [type, setType] = useState<'lime' | 'acid-adjuster'>('acid-adjuster');

  return (
    <Card>
      <CardHeader
        title="Acid Adjusting"
        action={
          <ToggleButtonGroup
            value={type}
            onChange={(_, newVal) =>
              setType(newVal === 'lime' ? 'lime' : 'acid-adjuster')
            }
            size="small"
            aria-label="Preferred acid-adjusting technique"
            exclusive
          >
            <ToggleButton value="acid-adjuster">Acid Adjuster</ToggleButton>
            <ToggleButton value="lime">Lime</ToggleButton>
          </ToggleButtonGroup>
        }
        sx={{
          pb: 3,
        }}
      />
      {type === 'lime' ? (
        <ClassicalCalculator defaultAcidity={defaultAcidity} />
      ) : (
        <AcidAdjusterCalculator defaultAcidity={defaultAcidity} />
      )}
    </Card>
  );
}
