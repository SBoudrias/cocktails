'use client';

import { tryConvertVolume } from '@cocktails/conversion';
import type { RecipeIngredient } from '@cocktails/data';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { match } from 'ts-pattern';
import Video from '#/components/Video';
import { formatAmount } from '#/modules/formatAmount';

const DEFAULT_JUICE_WEIGHT = 250;
const MINIMUM_CONTEXTUAL_JUICE_WEIGHT = DEFAULT_JUICE_WEIGHT;
const WATER_RATIO = 0.3;
const AGAR_RATIO = 0.003;

function getDefaultJuiceWeight(searchParams: Pick<URLSearchParams, 'get'>) {
  const amount = Number(searchParams.get('amount'));
  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_JUICE_WEIGHT;
  }

  const quantity = match(searchParams.get('unit'))
    .returnType<RecipeIngredient['quantity'] | undefined>()
    .with('gram', 'ml', 'oz', 'tsp', 'tbsp', 'cup', (unit) => ({ amount, unit }))
    .otherwise(() => undefined);
  if (quantity === undefined) {
    return DEFAULT_JUICE_WEIGHT;
  }

  const approximateWeight = match(quantity)
    .with({ unit: 'gram' }, ({ amount }) => amount)
    .otherwise(
      (volumeQuantity) =>
        tryConvertVolume(volumeQuantity, 'ml')?.amount ?? DEFAULT_JUICE_WEIGHT,
    );

  return Math.max(approximateWeight, MINIMUM_CONTEXTUAL_JUICE_WEIGHT);
}

export default function JuiceClarificationCalculator({ sx }: { sx?: SxProps }) {
  const searchParams = useSearchParams();
  const [defaultJuiceWeight] = useState(() => getDefaultJuiceWeight(searchParams));
  const [juiceWeightValue, setJuiceWeight] = useState<string | number>(
    defaultJuiceWeight,
  );

  const juiceWeight = Number(juiceWeightValue);
  const isJuiceWeightValid = Number.isFinite(juiceWeight) && juiceWeight > 0;
  const waterWeight = isJuiceWeightValid ? juiceWeight * WATER_RATIO : NaN;
  const agarWeight = isJuiceWeightValid ? juiceWeight * AGAR_RATIO : NaN;

  return (
    <Card sx={sx}>
      <CardHeader title="Juice Clarification" />
      <CardContent>
        <Stack spacing={2}>
          <TextField
            label="Raw juice weight"
            value={juiceWeightValue}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setJuiceWeight(event.target.value);
            }}
            error={!isJuiceWeightValid}
            helperText={!isJuiceWeightValid ? 'Must be greater than 0' : ''}
            fullWidth
            slotProps={{
              htmlInput: {
                min: 0,
                step: 'any',
              },
              input: {
                endAdornment: <InputAdornment position="end">grams</InputAdornment>,
              },
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Water"
              value={isNaN(waterWeight) ? '' : formatAmount(waterWeight, 2)}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Agar agar"
              value={isNaN(agarWeight) ? '' : formatAmount(agarWeight, 3)}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">grams</InputAdornment>,
                },
              }}
            />
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              color="secondary"
              onClick={() => {
                setJuiceWeight(defaultJuiceWeight);
              }}
            >
              Reset to defaults
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <CardContent>
        <Typography id="juice-clarification-instructions" variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Box
          component="ol"
          aria-labelledby="juice-clarification-instructions"
          sx={{ mt: 0, mb: 0, pl: 3 }}
        >
          <li>
            <Typography>
              Stir the agar agar into the water and let it bloom for a couple of minutes.
            </Typography>
          </li>
          <li>
            <Typography>
              Heat the mixture gently until it boils to activate the agar agar.
            </Typography>
          </li>
          <li>
            <Typography>
              Transfer it to a heatproof container and let it cool to room temperature
              until fully set.
            </Typography>
          </li>
          <li>
            <Typography>Break the agar gel into smaller pieces.</Typography>
          </li>
          <li>
            <Typography>Blend the gel while slowly pouring in the raw juice.</Typography>
          </li>
          <li>
            <Typography>
              Pour the mixture into a drip filter lined with two coffee filters.
            </Typography>
          </li>
          <li>
            <Typography>
              Let the juice filter without disturbing the gel raft. The first liquid may
              be cloudy while the raft forms.
            </Typography>
          </li>
        </Box>
      </CardContent>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Juice clarification technique by Kate McGraw.
        </Typography>
        <Video id="_5iicQymdTU" start={193} />
      </CardContent>
    </Card>
  );
}
