'use client';

import type { SxProps } from '@mui/material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { match } from 'ts-pattern';
import Video from '#/components/Video';
import { formatAmount } from '#/modules/formatAmount';
import { type SuperJuiceCitrus, calculateSuperJuice } from '#/modules/superJuice';

const DEFAULT_PEEL_WEIGHT = 100;

const CITRUS_INPUT_LABELS: Record<SuperJuiceCitrus, string> = {
  lemon: 'Lemon peel weight',
  lime: 'Lime peel weight',
  orange: 'Orange peel weight',
  grapefruit: 'Grapefruit peel weight',
  kumquat: 'Kumquat weight',
};

function CitrusSelector({
  citrus,
  onChange,
}: {
  citrus: SuperJuiceCitrus;
  onChange: (citrus: SuperJuiceCitrus) => void;
}) {
  return (
    <ToggleButtonGroup
      value={citrus}
      onChange={(_, value: unknown) =>
        match(value)
          .with('lemon', () => onChange('lemon'))
          .with('lime', () => onChange('lime'))
          .with('orange', () => onChange('orange'))
          .with('grapefruit', () => onChange('grapefruit'))
          .with('kumquat', () => onChange('kumquat'))
          .otherwise(() => undefined)
      }
      size="small"
      aria-label="Citrus type"
      exclusive
      fullWidth
    >
      <ToggleButton value="lemon">Lemon</ToggleButton>
      <ToggleButton value="lime">Lime</ToggleButton>
      <ToggleButton value="orange">Orange</ToggleButton>
      <ToggleButton value="grapefruit">Grapefruit</ToggleButton>
      <ToggleButton value="kumquat">Kumquat</ToggleButton>
    </ToggleButtonGroup>
  );
}

function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: <InputAdornment position="end">grams</InputAdornment>,
        },
      }}
    />
  );
}

function formatGrams(value: number, fractionDigits = 2) {
  return Number.isFinite(value) ? formatAmount(value, fractionDigits) : '';
}

export default function SuperJuiceCalculator({ sx }: { sx?: SxProps }) {
  const [citrus, setCitrus] = useState<SuperJuiceCitrus>('lime');
  const [inputWeightValue, setInputWeight] = useState<string | number>(
    DEFAULT_PEEL_WEIGHT,
  );
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>('');

  const inputWeight = Number(inputWeightValue);
  const juiceWeightRaw = juiceWeightValue === '' ? undefined : Number(juiceWeightValue);
  const isInputWeightValid = Number.isFinite(inputWeight) && inputWeight > 0;
  const isJuiceWeightValid =
    juiceWeightRaw == null || (Number.isFinite(juiceWeightRaw) && juiceWeightRaw >= 0);
  const isKumquat = citrus === 'kumquat';
  const showsMalic = match(citrus)
    .with('lime', 'orange', 'grapefruit', () => true)
    .otherwise(() => false);
  const showsMsg = citrus === 'grapefruit';

  const superJuice = calculateSuperJuice({
    citrus,
    inputWeight,
    juiceWeight: juiceWeightRaw,
  });

  return (
    <Card sx={sx}>
      <CardHeader
        title="Super Juice"
        subheader={
          <Typography variant="body2" color="text.secondary">
            Acid-adjusted, peel-oleated citrus juice. Technique by Nickle Morris; ratios
            after Kevin Kos’s published recipes.
          </Typography>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <CitrusSelector citrus={citrus} onChange={setCitrus} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label={CITRUS_INPUT_LABELS[citrus]}
              value={inputWeightValue}
              type="number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setInputWeight(event.target.value);
              }}
              error={!isInputWeightValid}
              helperText={!isInputWeightValid ? 'Must be greater than 0' : ''}
              fullWidth
              slotProps={{
                htmlInput: { min: 0, step: 'any' },
                input: {
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
            {!isKumquat && (
              <TextField
                label="Fresh juice (optional)"
                value={juiceWeightValue}
                type="number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setJuiceWeight(event.target.value);
                }}
                error={!isJuiceWeightValid}
                helperText={!isJuiceWeightValid ? 'Must be zero or greater' : ''}
                fullWidth
                slotProps={{
                  htmlInput: { min: 0, step: 'any' },
                  input: {
                    endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                  },
                }}
              />
            )}
          </Stack>
          <ResultField label="Citric acid" value={formatGrams(superJuice.citricAcid)} />
          {showsMalic && (
            <ResultField label="Malic acid" value={formatGrams(superJuice.malicAcid)} />
          )}
          {showsMsg && <ResultField label="MSG" value={formatGrams(superJuice.msg, 3)} />}
          <ResultField label="Water" value={formatGrams(superJuice.water)} />
          {superJuice.approximateYield != null && (
            <ResultField
              label="Approximate yield"
              value={formatGrams(superJuice.approximateYield)}
            />
          )}
          {isKumquat && isInputWeightValid && (
            <Alert severity="info">
              Kumquats are used whole: the citric acid stands in for the missing peel
              weight (25% of the fruit), and the water scales with the acid. Optionally
              add ascorbic acid (vitamin C) at 0.04% of the strained yield to hold the
              aroma longer.
            </Alert>
          )}
          <Stack
            direction="row"
            role="group"
            aria-label="Super juice calculator actions"
            spacing={1}
            sx={{ justifyContent: 'space-between' }}
          >
            <Link
              href={{ pathname: '/calculators/acid-adjusting' }}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                component="span"
                variant="button"
                color="primary"
                sx={{
                  alignItems: 'center',
                  borderRadius: 1,
                  display: 'inline-flex',
                  minHeight: 36,
                  px: 1.25,
                  py: 0.75,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                Acid adjust instead
              </Typography>
            </Link>
            <Button
              color="secondary"
              onClick={() => {
                setInputWeight(DEFAULT_PEEL_WEIGHT);
                setJuiceWeight('');
              }}
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <CardContent>
        <Typography id="super-juice-instructions" variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Box
          component="ol"
          aria-labelledby="super-juice-instructions"
          sx={{ mt: 0, mb: 0, pl: 3 }}
        >
          <li>
            <Typography>
              Peel the citrus and weigh the peels. Kumquats skip this step: weigh the
              whole fruit and muddle it with the citric acid instead.
            </Typography>
          </li>
          <li>
            <Typography>
              Combine the peels with the calculated acids in a jar. Shake well and rest at
              room temperature for up to two hours to draw out the oils into an oleo
              citrate.
            </Typography>
          </li>
          <li>
            <Typography>
              Transfer everything to a blender, add the water (rinse the jar with it to
              carry over every last bit of oleo citrate) and the fresh juice.
            </Typography>
          </li>
          <li>
            <Typography>
              Blend for about half a minute, then strain through a cheesecloth.
            </Typography>
          </li>
          <li>
            <Typography>
              Bottle and refrigerate; use within a week for peak flavor.
            </Typography>
          </li>
        </Box>
      </CardContent>
      <CardContent>
        <Video id="2RA3AaCO7A8" start={313} />
      </CardContent>
    </Card>
  );
}
