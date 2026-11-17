import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createAgent } from '@ui-sdk/react/agent';
import { useState } from 'react';
import UnitSelector from './Selector';

function StatefulUnitSelector() {
  const [unit, setUnit] = useState<'oz' | 'ml'>('oz');
  return <UnitSelector value={unit} onChange={setUnit} />;
}

describe('UnitSelector', () => {
  it('renders one named radiogroup with the active unit checked', () => {
    render(<UnitSelector value="oz" onChange={() => {}} />);

    const group = screen.getByRole('radiogroup', { name: 'Preferred measurement unit' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'oz' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'ml' })).not.toBeChecked();
  });

  it('checks the other unit on click and never deselects when pressed again', async () => {
    const user = userEvent.setup();
    render(<StatefulUnitSelector />);

    await user.click(screen.getByRole('radio', { name: 'ml' }));
    expect(screen.getByRole('radio', { name: 'ml' })).toBeChecked();

    // Pressing the now-active item keeps it: radio semantics never call
    // back with null the way a toggle group could deselect.
    await user.click(screen.getByRole('radio', { name: 'ml' }));
    expect(screen.getByRole('radio', { name: 'ml' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'oz' })).not.toBeChecked();
  });

  it('moves between units with arrow keys from a single tab stop', async () => {
    const user = userEvent.setup();
    render(<StatefulUnitSelector />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'oz' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'ml' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'ml' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'oz' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'oz' })).toHaveFocus();

    // The unchecked radios are not tab stops: one Tab leaves the group.
    await user.tab();
    expect(screen.getByRole('radio', { name: 'oz' })).not.toHaveFocus();
    expect(screen.getByRole('radio', { name: 'ml' })).not.toHaveFocus();
  });

  it('an agent can find the unit picker and set it', async () => {
    const agent = createAgent();
    render(<StatefulUnitSelector />);

    const components = agent.snapshot().filter((entry) => !entry.offPage);
    for (const entry of components) {
      expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
    }
    const labels = components.map((entry) => entry.label);
    expect(labels).toContain('Preferred measurement unit');

    const result = await agent.act({
      steps: [
        {
          ref: 'Preferred measurement unit',
          action: 'setValue',
          args: ['ml'],
        },
      ],
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(screen.getByRole('radio', { name: 'ml' })).toBeChecked();
  });
});
