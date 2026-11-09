import { describe, expect, it } from 'vitest';
import { groupByAddedDay } from './groupByAddedDay';

describe('groupByAddedDay', () => {
  it('groups items by day, newest day first, keeping the order within a day', () => {
    expect(
      groupByAddedDay([
        { day: '2026-05-18', item: 'Snake Eyes' },
        { day: '2026-05-16', item: '9th Wonder' },
        { day: '2026-05-18', item: 'Belmont Jewel' },
        { day: '2026-05-20', item: 'Amaretto Sour' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "day": "2026-05-20",
          "items": [
            "Amaretto Sour",
          ],
          "label": "May 20, 2026",
        },
        {
          "day": "2026-05-18",
          "items": [
            "Snake Eyes",
            "Belmont Jewel",
          ],
          "label": "May 18, 2026",
        },
        {
          "day": "2026-05-16",
          "items": [
            "9th Wonder",
          ],
          "label": "May 16, 2026",
        },
      ]
    `);
  });

  it('returns no groups without entries', () => {
    expect(groupByAddedDay([])).toEqual([]);
  });
});
