/**
 * @import { TSprintAnimationState } from "#libs/types/core.js";
 */
import * as _commonTypes from "#libs/types/common.js";

/**
 * @template {string} TSpriteAnimationName
 * @param {{ name: TSpriteAnimationName; frames: number }[]} states
 * @param {{
 * 	width: number;
 * 	height: number;
 *  offsetX?: number; // Horizontal gap between frames (default: 0)
 *  offsetY?: number; // Vertical gap between frames (default: 0)
 * }} spriteMeta
 */
export function generateSpriteAnimationStates(states, spriteMeta) {
  /** @type {Partial<TSprintAnimationState<TSpriteAnimationName>>} */
  const sprintAnimationState = {};

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    /** @type {TSprintAnimationState<TSpriteAnimationName>[TSpriteAnimationName]} */
    const spriteAnimationState = (sprintAnimationState[state.name] = {
      locations: new Array(state.frames),
    });

    if (spriteMeta.width <= 0 || spriteMeta.height <= 0) {
      throw new Error("Sprite dimensions must be positive numbers.");
    }

    for (let j = 0; j < state.frames; j++) {
      spriteAnimationState.locations[j] = {
        x: (spriteMeta.width + (spriteMeta.offsetX ?? 0)) * j,
        y: (spriteMeta.height + (spriteMeta.offsetY ?? 0)) * i,
      };
    }
  }

  return /** @type {TSprintAnimationState<TSpriteAnimationName>} */ (
    sprintAnimationState
  );
}
