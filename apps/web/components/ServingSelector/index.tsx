'use client';

import { Minus, Plus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group';

const MIN_SERVINGS = 0.25;
const MAX_SERVINGS = 50;

export default function ServingSelector({
  servings,
  onChange,
}: {
  servings: number;
  onChange: (servings: number) => void;
}) {
  const labelId = useId();
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
    // An outlined field with its label notched into the border: the
    // fieldset is the outline, its legend the notch. Fixed widths: 151px
    // on phones, 166px from 600px up.
    <div className="group relative w-[151px] min-[600px]:w-[166px]">
      <fieldset
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -top-1.25 rounded-sm border border-input px-2.25 group-focus-within:border-2 group-focus-within:border-primary"
      >
        <legend
          id={labelId}
          className="px-1.25 text-xs leading-[1.4375] text-muted-foreground group-focus-within:text-primary"
        >
          Servings
        </legend>
      </fieldset>
      <InputGroup
        aria-labelledby={labelId}
        className="h-10 border-0 px-3.5 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
      >
        <InputGroupAddon className="mr-2">
          <InputGroupButton
            className="size-7.5"
            onClick={handleDecrement}
            disabled={servings <= MIN_SERVINGS}
            aria-label="Decrement"
          >
            <Minus className="size-5" />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          type="number"
          className="h-auto w-11.75 flex-none self-stretch pl-0 leading-5.75 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          value={inputValue ?? servings}
          onChange={handleChange}
          onBlur={handleBlur}
          min={MIN_SERVINGS}
          max={MAX_SERVINGS}
          step={MIN_SERVINGS}
          aria-label="Number of servings"
        />
        <InputGroupAddon align="inline-end" className="ml-2">
          <InputGroupButton
            className="size-7.5"
            onClick={handleIncrement}
            disabled={servings >= MAX_SERVINGS}
            aria-label="Increment"
          >
            <Plus className="size-5" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
