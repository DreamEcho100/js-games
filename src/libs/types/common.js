/**
 * @template TValue
 *
 * @typedef {[null, TValue] | [Error, null]} TResult
 */

/**
 * @typedef {{
 *  type: 'image',
 *  src: string,
 * }} TLoadImage
 * @typedef {{
 *  type: 'audio',
 *  src: string,
 * }} TLoadAudio
 * @typedef {TLoadImage | TLoadAudio} TLoadAsset
 */

/**
 * @template {TLoadAsset[]} TArr
 * @template {(HTMLImageElement | HTMLAudioElement)[]} [TTuple=[]]
 *
 * @typedef {TArr['length'] extends 0 ? TTuple : TArr extends readonly [infer TItem, ...infer Rest extends TLoadAsset[]] ? TItem extends TLoadImage ? TElementTypeMapperForAssets<Rest, [...TTuple, HTMLImageElement]> : TItem extends TLoadAudio ? TElementTypeMapperForAssets<Rest, [...TTuple, HTMLAudioElement]> : never : never} TElementTypeMapperForAssets
 */

export default {};
