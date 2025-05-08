/**
 * @template TItem
 *
 * @param {TItem[]} arr
 * @param {(value: TItem, index: number, array: TItem[]) => string} callbackfn
 * @returns {string}
 */
export function reduceToString(arr, callbackfn) {
	let acc = "";

	for (let i = 0; i < arr.length; i++) {
		acc += callbackfn(arr[i], i, arr);
	}

	return acc;
}

//const t = {
//	1: 1,
//	2: 2,
//};
