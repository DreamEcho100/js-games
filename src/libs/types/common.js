/**
 * @template TValue
 *
 * @typedef {[null, TValue] | [Error, null]} TResult
 */

/**
 * @template {any[]} TArr
 * @template TItem
 * @template {TItem[]} [TTuple=[]]
 * @typedef {TArr['length'] extends 0 ? TTuple : TArr extends [unknown, ...infer Rest] ? MirrorTupleWith<Rest,TItem, [...TTuple, TItem]> : never} MirrorTupleWith
 */

export {};
