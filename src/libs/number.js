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
export function clampValue(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
