/**
 * @description Rounds a number to passed precision.
 *
 * @param {number} n
 * @param {number} precision - The number of decimal places to round to.
 * @returns number
 */
export const roundToPrecision = (n, precision) =>
  Math.round((n + Number.EPSILON) * Math.pow(10, precision)) /
  Math.pow(10, precision);
// export const round = (n, precision = 2) => {
// 	const factor = Math.pow(10, precision);
// 	return Math.round(n * factor) / factor;
// }
// const round2 = (n) => Number(n.toFixed(2));
// const round2 = (n) => Math.round(n * 100) / 100;

/**
 *
 * @param {{x: number, y: number, width: number, height: number}} rect1
 * @param {{x: number, y: number, width: number, height: number}} rect2
 * @returns {boolean}
 */
export const rect2rectCollision = (rect1, rect2) => {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
};

/**
 * @param {{x: number, y: number, radius: number}} circle1
 * @param {{x: number, y: number, radius: number}} circle2
 * @returns {boolean}
 */
export const circle2circleCollision = (circle1, circle2) => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const r = circle1.radius + circle2.radius;

  return dx * dx + dy * dy < r * r;
};
