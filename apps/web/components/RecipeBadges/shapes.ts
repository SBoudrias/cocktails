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

// Closed polygon through `points`, turned `deg` clockwise around (cx, cy).
function rotated(points: [number, number][], deg: number, cx: number, cy: number) {
  const rad = (deg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
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
);
const bigRock = cube(12, 2.5, 8);
const iceCubes = [cube(7.5, 11.25, 4.5), cube(16.5, 11.25, 4.5), cube(12, 4.5, 4.5)];

export const preparationShapes: Record<Recipe['preparation'], Shape> = {
  // tilted boston shaker with motion marks
  shaken: {
    body: `${bostonSmallTin} ${bostonBigTin}`,
    material: 'silver',
    motion:
      'M3.4 9.4 Q2.6 12 3.6 14.6 M5.6 16.6 Q5 18.4 5.8 20 M20.6 9.6 Q21.4 7 20.4 4.4 M18.4 2.6 Q19 4 18.6 5.2',
  },
  // yarai mixing glass: thick base, spout, diamond cut, with a bar spoon
  stirred: {
    body: 'M5 6.5 H17 V19.6 Q17 21.2 15.4 21.2 H6.6 Q5 21.2 5 19.6 Z',
    level: 10,
    parts: 'M5 6.6 L3.6 5.6 M9.2 17.5 L19 2.4',
    facets:
      'M5.2 13.4 L7.2 17 L9.2 13.4 L11.2 17 L13.2 13.4 L15.2 17 L16.8 14.2 M5.2 17 L7.2 13.4 L9.2 17 L11.2 13.4 L13.2 17 L15.2 13.4 L16.8 16.2 M5.2 18.6 H16.8',
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
    motion:
      'M6.8 4.6 A5.2 1.9 0 1 0 14.98 3.04 M14.98 3.04 l1.11 1.3 M14.98 3.04 l1.6 -0.6',
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
  'crushed ice': {
    ice: [
      'M2.8 16.4 L6.6 15.8 L7.4 20.6 L3.2 21 Z',
      'M8.4 16 L12 15.4 L12.6 20.8 L8.8 21 Z',
      'M13.8 15.6 L17.2 16.2 L16.8 21 L13.6 20.8 Z',
      'M18.4 16.6 L21.4 17.4 L21 21 L18.2 21 Z',
      'M5 11.6 L8.8 10.8 L9.6 14.4 L5.4 14.8 Z',
      'M10.6 10.6 L14 11 L13.6 14.2 L10.8 14 Z',
      'M15.4 11.4 L19 12 L18.4 15.2 L15 14.6 Z',
      'M8.6 6.6 L12 6 L12.6 9.4 L9 9.6 Z',
      'M13.4 7.2 L16.2 7.8 L15.6 10 L13.6 9.8 Z',
      'M11 2.6 L13.6 3 L13.2 5 L11.2 4.8 Z',
    ].join(' '),
  },
  // a frozen slush dome
  blended: {
    ice: 'M3 20 C3 12 6.8 6.5 12 6.5 C17.2 6.5 21 12 21 20 Z',
    facets:
      'M5.2 15 Q7.2 13.6 9.2 15 T13.2 15 T17.2 15 T19.4 14.6 M7.6 10.8 Q9.8 9.6 12 10.8 T16.4 10.8',
    solid: 'M12 2 a1.3 1.3 0 1 1 0 2.6 a1.3 1.3 0 1 1 0 -2.6 Z',
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
    body: 'M3 5.5 H21 C21 10 17 12.5 12 12.5 C7 12.5 3 10 3 5.5 Z',
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
    body: 'M5 3 H15.5 L14.8 14.2 Q14.6 15.6 13 15.6 H7.5 Q5.9 15.6 5.7 14.2 Z',
    level: 4.8,
    parts:
      'M10.25 15.6 V19.6 M6.5 20.6 H14 M15.3 6 H17.2 Q18.8 6 18.8 7.6 V10 Q18.8 11.6 17.2 11.6 H14.9',
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
  // copper mug
  mule: {
    body: 'M4.6 4 H15.4 C16.4 8.5 16.4 16.5 15.4 21 H4.6 C3.6 16.5 3.6 8.5 4.6 4 Z',
    material: 'copper',
    parts: 'M16.2 8 H18 Q20 8 20 10 V14 Q20 16 18 16 H16.2',
    facets: 'M4.4 6.8 H15.6 M4.4 18.2 H15.6',
  },
  // carved ceramic mug, the app icon's tiki
  tiki: {
    body: 'M5 3 H19 L17.8 20 Q17.7 21.5 16 21.5 H8 Q6.3 21.5 6.2 20 Z',
    material: 'ceramic',
    facets:
      'M7.5 6.6 L9 7.8 L10.5 6.6 L12 7.8 L13.5 6.6 L15 7.8 L16.5 6.6 M8 11 H10.6 M13.4 11 H16 M12 9.8 V13.6 M8.8 15.6 H15.2 V18 H8.8 Z M10.95 15.6 V18 M13.05 15.6 V18',
  },
  // footed punch bowl and its ladle
  punch: {
    body: 'M2.5 9 H21.5 C21.5 14.5 17.5 17.5 12 17.5 C6.5 17.5 2.5 14.5 2.5 9 Z',
    level: 11,
    parts: 'M9.8 17.5 L8.6 20.5 H15.4 L14.2 17.5 M15 12.5 L18.2 3.5 H20.5',
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
