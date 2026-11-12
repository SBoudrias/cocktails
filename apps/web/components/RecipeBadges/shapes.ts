import type { Recipe } from '@cocktails/data';

/**
 * Icon geometry for the recipe header badges, on a 24px grid. Every icon is
 * built from the same layers so the three badges read as one family:
 * - `body`: the closed silhouette of the glass, tool or vessel
 * - `liquid` + `level`: the region the drink fills (defaults to `body`) and the
 *   y of its surface
 * - `material`: an opaque vessel (metal cup, ceramic mug) instead of glass
 * - `parts`: stems, feet, handles, spoons (outlined)
 * - `facets`: inner detail lines
 * - `ice`: ice shapes, drawn alone for the served-on badge
 * - `motion`: arrows and motion marks for the preparation badge
 * - `solid`: small filled shapes (dots, knobs)
 */
export type Shape = {
  body?: string;
  liquid?: string;
  level?: number;
  material?: 'silver' | 'copper' | 'ceramic';
  parts?: string;
  facets?: string;
  ice?: string;
  motion?: string;
  solid?: string;
};

// 2:1 isometric cube: top vertex at (cx, y), half-width a.
function cube(cx: number, y: number, a: number) {
  const h = a / 2;
  return {
    outline: `M${cx} ${y} L${cx + a} ${y + h} V${y + h + a} L${cx} ${y + 2 * a} L${cx - a} ${y + h + a} V${y + h} Z`,
    facets: `M${cx - a} ${y + h} L${cx} ${y + a} L${cx + a} ${y + h} M${cx} ${y + a} V${y + 2 * a}`,
  };
}

// Closed polygon through `points`, scaled and turned `deg` clockwise around (cx, cy).
function rotated(
  points: [number, number][],
  deg: number,
  cx: number,
  cy: number,
  scale: number,
) {
  const rad = (deg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(rad) * scale, Math.sin(rad) * scale];
  const turned = points.map(([x, y]) => {
    const [dx, dy] = [x - cx, y - cy];
    return `${(cx + dx * cos - dy * sin).toFixed(2)} ${(cy + dx * sin + dy * cos).toFixed(2)}`;
  });
  return `M${turned.join(' L')} Z`;
}

const stem = (top: number) => `M12 ${top} V20.5 M8 21 H16`;
// Boston shaker, tilted mid-shake: the small tin sealed mouth-down into the big one.
const bostonTilt = 30;
const bostonSmallTin = rotated(
  [
    [9.9, 3.5],
    [14.1, 3.5],
    [15.6, 11],
    [8.4, 11],
  ],
  bostonTilt,
  12,
  12.25,
  0.85,
);
const bostonBigTin = rotated(
  [
    [7.6, 11],
    [16.4, 11],
    [15.3, 21],
    [8.7, 21],
  ],
  bostonTilt,
  12,
  12.25,
  0.85,
);
const bigRock = cube(12, 2.5, 8);
const iceCubes = [cube(7.5, 11.25, 4.5), cube(16.5, 11.25, 4.5), cube(12, 4.5, 4.5)];

export const preparationShapes: Record<Recipe['preparation'], Shape> = {
  // tilted boston shaker with motion marks
  shaken: {
    body: `${bostonSmallTin} ${bostonBigTin}`,
    material: 'silver',
    // a pair of curved motion lines beside the shaker's top-left side and
    // another beside its bottom-right side
    motion:
      'M11.4 4.45 Q9.78 6.06 9.2 8.27 M9.02 3.77 Q7.79 4.91 7.42 6.55 M16.07 15.74 Q15.49 17.95 13.87 19.56 M17.85 17.46 Q17.48 19.1 16.25 20.24',
  },
  // yarai mixing glass: thick base, spout, diamond cut, with a bar spoon
  stirred: {
    body: 'M2.8 5.4 Q4.6 5.8 5 7.4 V19.6 Q5 21.2 6.6 21.2 H15.4 Q17 21.2 17 19.6 V6.5 H6.6 Q4.8 6.5 2.8 5.4 Z',
    level: 10,
    // bar spoon: shaft out of the glass, its bowl resting at the bottom
    parts:
      'M9.2 17.4 L19 2.4 M9.31 17.33 A1.8 1.1 -57 1 0 7.35 20.35 A1.8 1.1 -57 1 0 9.31 17.33 Z',
    // the diamond cut sits above the spoon bowl so the bowl reads clearly
    facets:
      'M5.2 11.8 L7.2 14.8 L9.2 11.8 L11.2 14.8 L13.2 11.8 L15.2 14.8 L16.8 12.4 M5.2 14.8 L7.2 11.8 L9.2 14.8 L11.2 11.8 L13.2 14.8 L15.2 11.8 L16.8 14.2',
    solid: 'M19.3 0.9 a1.3 1.3 0 1 1 0 2.6 a1.3 1.3 0 1 1 0 -2.6 Z',
  },
  // poured straight into the glass, in layers
  built: {
    body: 'M4.5 10 H19.5 L18.6 19.8 Q18.4 21.5 16.8 21.5 H7.2 Q5.6 21.5 5.4 19.8 Z',
    level: 13.5,
    facets: 'M5.4 17.2 H18.6',
    motion: 'M12 2 V7.6 M9.4 5.2 L12 7.8 L14.6 5.2',
  },
  // countertop blender: jar on its motor base
  blended: {
    body: 'M6.5 3 H17.5 L16 14.5 H8 Z M7.5 14.5 H16.5 L17.6 21.5 H6.4 Z',
    liquid: 'M6.5 3 H17.5 L16 14.5 H8 Z',
    level: 7,
    facets: 'M10 12 L14 10.6 M11 18 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0',
  },
  // Hamilton Beach-style drink mixer: bullet motor head on a column, the
  // spindle down into a hanging tin, the column on a round foot
  'flash blended': {
    body: 'M5 2.5 H14.5 C18.2 2.5 20.5 3.8 20.5 5.5 C20.5 7.2 18.2 8.5 14.5 8.5 H5 Q3.5 8.5 3.5 7 V4 Q3.5 2.5 5 2.5 Z M4.6 8.5 H7.6 V19 H4.6 Z M2.6 21.5 Q2.6 19 6.1 19 Q9.6 19 9.6 21.5 Z M11.6 11 H19.6 L18.7 21 H12.5 Z',
    liquid: 'M11.6 11 H19.6 L18.7 21 H12.5 Z',
    level: 14,
    parts: 'M15.6 8.5 V17.5 M7.6 12 H11.6',
    facets: 'M14.6 17.5 H16.6 M8.5 5.5 H12.5',
    solid: 'M17.6 4.7 a0.8 0.8 0 1 1 0 1.6 a0.8 0.8 0 1 1 0 -1.6 Z',
  },
  // lele swizzle stick spun in the glass
  swizzled: {
    body: 'M7 9 H17 L16.2 21.5 H7.8 Z',
    level: 11.5,
    parts: 'M12 1.8 V17.6 M12 17.6 L9.6 19.2 M12 17.6 L14.4 19.2 M12 17.6 V19.8',
    // the arrowhead opens wide and tilts up, clear of the curve behind it
    motion:
      'M16.5 3.65 A5.2 1.9 0 0 0 12.9 2.73 M11.1 2.73 A5.2 1.9 0 1 0 15.68 5.94 M15.68 5.94 l-1.69 -0.62 M15.68 5.94 l-0.9 1.56',
  },
  other: {
    solid:
      'M5.5 10 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z M12 10 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z M18.5 10 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z',
  },
};

// The ice alone, without a glass, so it never competes with the glassware badge.
export const servedOnShapes: Record<Recipe['served_on'], Shape> = {
  // no ice: a chilled drop with a frost star
  up: {
    body: 'M10 4 C10 4 4.5 10.5 4.5 15 A5.5 5.5 0 0 0 15.5 15 C15.5 10.5 10 4 10 4 Z',
    level: 4,
    facets: 'M7.6 15.2 Q7.8 17.6 9.8 18.4',
    motion: 'M18.5 2.5 V8.5 M15.9 4 L21.1 7 M15.9 7 L21.1 4',
  },
  'big rock': { ice: bigRock.outline, facets: bigRock.facets },
  'ice cubes': {
    ice: iceCubes.map((c) => c.outline).join(' '),
    facets: iceCubes.map((c) => c.facets).join(' '),
  },
  // a loose heap of irregular chunks and shards
  'crushed ice': {
    ice: [
      'M2.6 18.2 L4.8 15.6 L7.8 16.4 L8 20.2 L4 21.2 Z',
      'M8.8 21.2 L11 15.6 L13.8 20.8 Z',
      'M14.4 17.2 L17.8 15.6 L19.4 19 L15.8 21.2 Z',
      'M19.8 21.2 L20.6 17.6 L22 20.6 Z',
      'M4.4 12.6 L6.6 10.6 L9.4 11.6 L9.2 14.6 L6.2 15 Z',
      'M10.4 14.4 L11.4 9.4 L14.4 10.6 L13.4 14.6 Z',
      'M15.2 14.4 L16.8 10.2 L19.6 13.8 Z',
      'M7.6 8 L10 5.4 L12.4 7.6 L10 9.6 Z',
      'M13.4 6.4 L15.6 5.4 L17 7.4 L15.8 9.4 L13.8 9 Z',
      'M11.2 2.4 L13.2 3.2 L12 4.8 Z',
    ].join(' '),
    facets: 'M4.8 15.6 L5.6 18.6 M11.4 9.4 L12.4 12.4 M10 5.4 L10 9.6',
  },
  // frozen drink just after serving: the slush heaps a little above the
  // drink in a soft, slumping mound, all of it inside the glass
  blended: {
    body: 'M5 3.5 H19 L17.8 20 Q17.6 21.5 16 21.5 H8 Q6.4 21.5 6.2 20 Z',
    // the drink up to y 11, and the soft mound on top of it
    liquid:
      'M5.55 11 H18.45 L17.8 20 Q17.6 21.5 16 21.5 H8 Q6.4 21.5 6.2 20 Z M5.6 11 C5.8 9.4 7 8.8 8.4 9 C9 7.6 10.6 7 12 7.4 C12.6 6.4 14.2 6.4 14.8 7.6 C16.4 7.6 17.8 8.6 18.4 10.2 L18.35 11 Z',
    level: 6.5,
    // where the slush settles into the drink
    facets: 'M6.4 11.2 Q9.2 12.2 12 11.2 T17.6 11.2',
  },
};

export const glasswareShapes: Record<Recipe['glassware'], Shape> = {
  'old fashioned': {
    body: 'M4.5 8 H19.5 L18.6 19.6 Q18.5 21 17 21 H7 Q5.5 21 5.4 19.6 Z',
    level: 12,
    facets: 'M5.6 18.4 H18.4',
  },
  collins: {
    body: 'M7.5 2 H16.5 V20.5 Q16.5 21.8 15.2 21.8 H8.8 Q7.5 21.8 7.5 20.5 Z',
    level: 6,
    facets: 'M7.6 19.6 H16.4',
  },
  highball: {
    body: 'M6 5 H18 L17.2 20 Q17.1 21.5 15.6 21.5 H8.4 Q6.9 21.5 6.8 20 Z',
    level: 8.5,
    facets: 'M6.9 19.2 H17.1',
  },
  snifter: {
    body: 'M8.5 4 C6 6.5 4.5 9.5 4.5 12.5 C4.5 15.5 7.5 17.5 12 17.5 C16.5 17.5 19.5 15.5 19.5 12.5 C19.5 9.5 18 6.5 15.5 4 Z',
    level: 12,
    parts: 'M12 17.5 V20.5 M8 21 H16',
  },
  coupe: {
    body: 'M4.2 5.5 H19.8 C19.8 10 16.4 12.5 12 12.5 C7.6 12.5 4.2 10 4.2 5.5 Z',
    level: 7.5,
    parts: stem(12.5),
  },
  martini: { body: 'M3 3.5 H21 L12 12.5 Z', level: 6, parts: stem(12.5) },
  'nick & nora': {
    body: 'M7 2.5 H17 C17 8 15.5 12.5 12 12.5 C8.5 12.5 7 8 7 2.5 Z',
    level: 5.5,
    parts: stem(12.5),
  },
  // footed glass mug, cream floated on top
  irish: {
    body: 'M5 3 H15.5 L14.8 14.2 Q14.6 15.6 13 15.6 H7.5 Q5.9 15.6 5.7 14.2 Z M8.6 15.6 H11.9 L11.3 18.8 H9.2 Z M6.6 18.8 H13.9 Q14.8 18.8 14.8 19.8 V20.2 Q14.8 21.2 13.9 21.2 H6.6 Q5.7 21.2 5.7 20.2 V19.8 Q5.7 18.8 6.6 18.8 Z',
    liquid: 'M5 3 H15.5 L14.8 14.2 Q14.6 15.6 13 15.6 H7.5 Q5.9 15.6 5.7 14.2 Z',
    level: 4.8,
    parts: 'M15.3 6 H17.2 Q18.8 6 18.8 7.6 V10 Q18.8 11.6 17.2 11.6 H14.9',
    facets: 'M5.2 7.6 H15.2',
  },
  hurricane: {
    body: 'M7 2 H17 C17 5 15 6.5 15 9 C15 11 17.5 12.5 17.5 15 C17.5 17.5 15 18.5 12 18.5 C9 18.5 6.5 17.5 6.5 15 C6.5 12.5 9 11 9 9 C9 6.5 7 5 7 2 Z',
    level: 5,
    parts: 'M12 18.5 V20.5 M8.5 21 H15.5',
  },
  // frosted metal cup
  julep: {
    body: 'M5.5 3.5 H18.5 L17 19.5 H7 Z',
    material: 'silver',
    parts: 'M6.2 21 H17.8',
    facets:
      'M5.8 6.5 H18.2 M9.2 10 V12 M12 11 V13 M14.8 10 V12 M10.6 14.6 V16.4 M13.4 14.6 V16.4',
  },
  // moscow mule mug: hammered copper barrel with rounded sides, ridged near
  // the rim and the base, riveted strap handle
  mule: {
    body: 'M4.8 3.5 H15.2 C16.8 8 16.8 17 15.2 21.5 H4.8 C3.2 17 3.2 8 4.8 3.5 Z',
    material: 'copper',
    parts:
      'M16.1 7.5 H18.4 Q20 7.5 20 9.1 V14.9 Q20 16.5 18.4 16.5 H16.1 M16.2 9.5 H17.4 Q18 9.5 18 10.1 V13.9 Q18 14.5 17.4 14.5 H16.2',
    // ridges, then hammer dimples
    facets:
      'M4.3 5.6 H15.7 M4.3 19.4 H15.7 M7.4 9.4 q0.7 0.3 1.4 0 M11 8.8 q0.7 0.3 1.4 0 M12.8 11.4 q0.7 0.3 1.4 0 M9.2 12.4 q0.7 0.3 1.4 0 M6.4 14.4 q0.7 0.3 1.4 0 M11.8 14.8 q0.7 0.3 1.4 0 M8.6 16.8 q0.7 0.3 1.4 0',
    solid:
      'M17 7.8 a0.7 0.7 0 1 1 0 1.4 a0.7 0.7 0 1 1 0 -1.4 Z M17 14.8 a0.7 0.7 0 1 1 0 1.4 a0.7 0.7 0 1 1 0 -1.4 Z',
  },
  // carved ceramic mug, the app icon's tiki
  tiki: {
    body: 'M5 3 H19 L17.8 20 Q17.7 21.5 16 21.5 H8 Q6.3 21.5 6.2 20 Z',
    material: 'ceramic',
    facets:
      'M7.5 6.6 L9 7.8 L10.5 6.6 L12 7.8 L13.5 6.6 L15 7.8 L16.5 6.6 M8 11 H10.6 M13.4 11 H16 M12 9.8 V13.6 M8.8 15.6 H15.2 V18 H8.8 Z M10.95 15.6 V18 M13.05 15.6 V18',
  },
  // ceramic scorpion bowl: carved band, a flaming volcano in the middle and
  // long straws to share
  punch: {
    body: 'M2.5 11.5 H21.5 C21.5 16.4 17.5 19 12 19 C6.5 19 2.5 16.4 2.5 11.5 Z M9.4 19 H14.6 L15.4 21.2 H8.6 Z',
    material: 'ceramic',
    parts: 'M9.6 11.5 L10.8 8.6 H13.2 L14.4 11.5 M6.4 11.5 L3.4 2.6 M17.6 11.5 L20.6 2.6',
    facets:
      'M4.8 14.6 L6.4 15.8 L8 14.6 L9.6 15.8 L11.2 14.6 L12.8 15.8 L14.4 14.6 L16 15.8 L17.6 14.6 L19.2 15.8',
    solid:
      'M12 3.6 C12.9 4.8 13.4 5.6 13.4 6.6 A1.4 1.4 0 0 1 10.6 6.6 C10.6 5.6 11.1 4.8 12 3.6 Z',
  },
  flute: {
    body: 'M9 2 H15 L14.6 11 C14.4 13.2 13.4 14 12 14 C10.6 14 9.6 13.2 9.4 11 Z',
    level: 4.5,
    parts: stem(14),
    // bubbles
    facets: 'M12 7.5 V7.51 M11 10 V10.01 M12.9 11.4 V11.41',
  },
  'footed pilsner': {
    body: 'M6.5 2 H17.5 L13.6 16.8 H10.4 Z',
    level: 5.5,
    parts: 'M10.6 16.8 L9.2 20.8 H14.8 L13.4 16.8',
  },
  goblet: {
    body: 'M4.5 3.5 H19.5 C19.5 9.8 16.6 13.2 12 13.2 C7.4 13.2 4.5 9.8 4.5 3.5 Z',
    level: 6.5,
    parts: stem(13.2),
    solid: 'M12 15.2 a1.5 1.5 0 1 1 0 3 a1.5 1.5 0 1 1 0 -3 Z',
  },
  'wine glass': {
    body: 'M7.5 2.5 H16.5 C17.6 6 17.6 9 16.5 11 C15.5 12.8 14 13.5 12 13.5 C10 13.5 8.5 12.8 7.5 11 C6.4 9 6.4 6 7.5 2.5 Z',
    level: 8,
    parts: stem(13.5),
  },
};
