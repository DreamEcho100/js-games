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
