/**
 * @description Scales a 2D size _(width and height)_ to fit within a container of specified dimensions.
 *
 * @param {{ containerWidth?: number; containerHeight?: number; sourceWidth: number; sourceHeight: number; }} options
 * @returns {{ width: number, height: number }}
 */
export function scale2dSizeToFit({
  containerWidth,
  containerHeight,
  sourceWidth,
  sourceHeight,
}) {
  let width;
  let height;

  const aspectRatio = sourceWidth / sourceHeight;

  if (typeof containerWidth === "number") {
    // Scale to fit the container width
    width = containerWidth;
    height = width / aspectRatio;
    return { width, height };
  }

  if (typeof containerHeight === "number") {
    // Scale to fit the container height
    height = containerHeight;
    width = height * aspectRatio;
    return { width, height };
  }

  throw new Error("Container dimensions are required.");
}

/**
 * @description
 * Clamps a number between a minimum and maximum value.
 * This is useful for ensuring that a value stays within a certain range.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
