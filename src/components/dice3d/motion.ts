/** Easing and layout of the 3D throw, without three so they can be tested and loaded early. */

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const x = Math.min(1, Math.max(0, t));
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Camera: distance from the dice and vertical field of view (degrees). */
export const CAMERA_Z = 6;
export const CAMERA_FOV = 35;
/** Height of the visible area at the plane of the dice. */
export const visibleHeight = () => 2 * CAMERA_Z * Math.tan((CAMERA_FOV * Math.PI) / 360);

/** Gap between dice, as a multiple of a die's diameter at scale 1 (circumradius 1). */
const SLOT = 2.2;

/** Scale of the dice so that `count` of them fit in `visibleWidth` (never above 1). */
export const diceScale = (count: number, visibleWidth: number) => Math.min(1, (visibleWidth * 0.92) / (count * SLOT));

/** Horizontal position of die `index` out of `count`, centered on the stage. */
export const diceX = (index: number, count: number, scale: number) => (index - (count - 1) / 2) * SLOT * scale;

export const THROW_STAGGER_MS = 70;
/** Duration of each die's throw so that the last one still ends within `spinMs`. */
export const dieDuration = (spinMs: number, count: number) => Math.max(700, spinMs - (count - 1) * THROW_STAGGER_MS);
