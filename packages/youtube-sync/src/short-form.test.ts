import { describe, expect, it } from 'vitest';
import { hasLongFormEquivalent, isShortFormVideo } from './short-form.ts';

describe('isShortFormVideo', () => {
  it('detects the #shorts hashtag', () => {
    expect(
      isShortFormVideo({
        title: "Easy Cobra's Fang #shorts #tiki #tikicocktail",
        duration: 62,
      }),
    ).toBe(true);
  });

  it('detects videos within the Shorts duration limit', () => {
    expect(isShortFormVideo({ title: 'Navy Grog', duration: 179 })).toBe(true);
  });

  it('keeps long-form videos', () => {
    expect(isShortFormVideo({ title: 'Navy Grog', duration: 430 })).toBe(false);
  });

  it('keeps videos without a known duration and without the hashtag', () => {
    expect(isShortFormVideo({ title: 'Navy Grog' })).toBe(false);
  });
});

describe('hasLongFormEquivalent', () => {
  const cobraLong = { title: "Cobra's Fang | A Tiki Cocktail Classic", duration: 512 };
  const jetPilot = { title: 'Jet Pilot | The more approachable zombie', duration: 459 };
  const cobraShort = {
    title: "Easy Cobra's Fang #shorts #tiki #tikicocktail #fassionola",
    duration: 62,
  };
  const channelVideos = [cobraLong, jetPilot, cobraShort];

  it('matches a short to the long-form episode with the same drink', () => {
    expect(hasLongFormEquivalent(cobraShort, channelVideos)).toBe(true);
  });

  it('keeps a short when no long-form video shares its title', () => {
    const saturn = { title: 'Saturn | A gin tiki classic', duration: 400 };
    const sunquench = { title: 'Sunquench #shorts #tiki', duration: 45 };

    expect(hasLongFormEquivalent(sunquench, [saturn, sunquench])).toBe(false);
  });

  it('does not match different drinks sharing one word', () => {
    const hemingway = { title: 'Hemingway Daiquiri | The papa', duration: 300 };
    const daiquiriThree = { title: 'Daiquiri No. 3 #shorts', duration: 30 };

    expect(hasLongFormEquivalent(daiquiriThree, [hemingway, daiquiriThree])).toBe(false);
  });
});
