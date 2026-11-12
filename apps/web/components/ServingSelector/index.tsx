'use client';

import { ActionIcon, TextInput } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

const MIN_SERVINGS = 0.25;
const MAX_SERVINGS = 50;

export default function ServingSelector({
  servings,
  onChange,
}: {
  servings: number;
  onChange: (servings: number) => void;
}) {
  const [draft, setDraft] = useState<{
    base: number;
    text: string;
  }>();
  const inputValue = draft?.base === servings ? draft.text : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    const value = Number(text);

    if (text !== '' && value >= MIN_SERVINGS && value <= MAX_SERVINGS) {
      setDraft(undefined);
      onChange(value);
    } else {
      setDraft({ base: servings, text });
    }
  };

  const handleIncrement = () => {
    setDraft(undefined);

    if (servings < MAX_SERVINGS) {
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
    setDraft(undefined);

    // At 0.25, button will be disabled
    if (servings > MIN_SERVINGS) {
      if (servings > 1) {
        onChange(servings - 1);
      } else if (servings > 0.5) {
        onChange(0.5);
      } else {
        onChange(MIN_SERVINGS);
      }
    }
  };

  const handleBlur = () => {
    setDraft(undefined);
  };

  return (
    <TextInput
      type="number"
      label="Servings"
      size="sm"
      w={140}
      value={inputValue ?? servings}
      onChange={handleChange}
      onBlur={handleBlur}
      min={MIN_SERVINGS}
      max={MAX_SERVINGS}
      step={MIN_SERVINGS}
      aria-label="Number of servings"
      styles={{ input: { textAlign: 'center' } }}
      leftSectionPointerEvents="all"
      rightSectionPointerEvents="all"
      leftSection={
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handleDecrement}
          disabled={servings <= MIN_SERVINGS}
          aria-label="Decrement"
        >
          <IconMinus size={16} />
        </ActionIcon>
      }
      rightSection={
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handleIncrement}
          disabled={servings >= MAX_SERVINGS}
          aria-label="Increment"
        >
          <IconPlus size={16} />
        </ActionIcon>
      }
    />
  );
}
