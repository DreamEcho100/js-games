/**
 * @template {string} TSpriteAnimationName
 * @typedef {Record<TSpriteAnimationName, { locations: { x: number; y: number }[]; size: number; }>} TSprintAnimationState
 */

/**
 * @template {string} TSpriteAnimationName
 *
 * @typedef {{
 *   animationStates: TSprintAnimationState<TSpriteAnimationName>;
 *   currentAnimationState: TSpriteAnimationName;
 *   img: HTMLImageElement;
 *   renderBaseWidth: number;
 *   renderBaseHeight?: number;
 *   width: number;
 *   height: number;
 * 	}} SpriteInfoInput
 */

/**
 * @template {string} TSpriteAnimationName
 *
 * @typedef {{
 *  animationStates: TSprintAnimationState<TSpriteAnimationName>
 * 	currentAnimationState: TSpriteAnimationName;
 * 	img: HTMLImageElement;
 * 	currentFrameX: number;
 * 	currentFrameY: number;
 * 	width: number;
 * 	height: number;
 * }} SpriteInfo
 */
/**
 * @typedef {{
 *  appElem: HTMLDivElement;
 *  handleGoPrevScreen?: () => void;
 * }} ScreenHandlerParams
 */

export default {};
