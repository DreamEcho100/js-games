// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
/** @import { TSprintAnimationState } from "#utils/types.js"; */

/**
 *  @param {string} stylesPath
 *
 * @example
 * ```js
 * const stylesheetLink = addStylesHead(
 * 		import.meta.resolve("./__style.css", new URL(import.meta.url)),
 * )
 *```
 */
export function addStyleSheetLinkToHead(stylesPath) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = stylesPath;
  document.head.appendChild(link);
  return link;
}

/** @param {number} ms */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {string} src */
export async function createImage(src) {
  const image = new Image();
  image.src = src;

  let sourceWidth = 0;
  let sourceHeight = 0;
  let imageLoaded = false;
  while (true) {
    image.addEventListener("load", function () {
      sourceWidth = image.naturalWidth;
      sourceHeight = image.naturalHeight;
      imageLoaded = true;
    });
    if (imageLoaded) {
      break;
    }
    await delay(100);
  }

  return {
    image,
    sourceWidth,
    sourceHeight,
  };
}

/**
 * @template {string} TSpriteAnimationName
 * @param {{ name: TSpriteAnimationName; frames: number }[]} states
 * @param {{ width: number; height: number; }} spriteMeta
 */
export function buildSpriteAnimationsStates(states, spriteMeta) {
  /** @type {Partial<TSprintAnimationState<TSpriteAnimationName>>} */
  const sprintAnimationState = {};

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    /** @type {TSprintAnimationState<TSpriteAnimationName>[TSpriteAnimationName]} */
    const spriteAnimationState = (sprintAnimationState[state.name] = {
      locations: [],
    });

    for (let j = 0; j < state.frames; j++) {
      spriteAnimationState.locations.push({
        x: spriteMeta.width * j,
        y: spriteMeta.height * i,
      });
    }
  }

  return /** @type {TSprintAnimationState<TSpriteAnimationName>} */ (
    sprintAnimationState
  );
}
