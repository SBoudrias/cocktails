'use client';

import { Selector } from 'antd-mobile';

export type Unit = 'oz' | 'ml';

const options: { value: Unit; label: string }[] = [
  { value: 'oz', label: 'oz' },
  { value: 'ml', label: 'ml' },
];

export default function UnitSelector({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  return (
    <Selector
      options={options}
      value={[value]}
      onChange={(values) => onChange(values[0] ?? value)}
      style={{ margin: '12px' }}
    />
  );
}
