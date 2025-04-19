/**
 * @import { MirrorTupleWith, TResult } from "#libs/types/common.js";
 * @import { CleanUpManager } from "./cleanup";
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _commonTypes from "#libs/types/common.js";

/**
 * Loads an image from a given source and returns its dimensions.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<TResult<HTMLImageElement>>}
 */
export async function loadImageElement(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = function (event) {
      const target = /** @type {HTMLImageElement} */ (event.target);
      if ("naturalHeight" in target && "naturalWidth" in target) {
        if (
          target.naturalHeight + target.naturalWidth === 0 ||
          target.width + target.height === 0
        ) {
          resolve([new Error("Image has no dimensions"), null]);
          return;
        }
      }

      // Once the image is loaded, resolve the promise with its natural dimensions.
      resolve([null, image]);
    };

    image.onerror = function (error) {
      // Reject the promise if the image fails to load.
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : `Error loading as image: ${src}`;

      resolve([new Error(`Failed to load image at ${src}: ${message}`), null]);
    };

    image.src = src;
  });
}

/**
 * Preloads multiple images in parallel using your existing createImage.
 * @template {string[]} Paths
 * @param {Paths} paths
 * @returns {Promise<TResult<MirrorTupleWith<Paths, HTMLImageElement>>>}
 */
export async function loadManyImageElement(paths) {
  const entries = await Promise.all(
    paths.map(async (src) => {
      const [err, result] = await loadImageElement(src);
      if (err) {
        return /** @type {const} */ ([
          new Error(`Failed to preload ${src}: ${err.message}`),
          null,
        ]);
      }
      return /** @type {const} */ ([null, result]);
    }),
  );

  const resultValue = new Array(entries.length);

  for (let i = 0; i < entries.length; i++) {
    const [err, result] = entries[i];
    if (err) {
      return [err, null];
    }

    resultValue[i] = result;
  }

  return [
    null,
    /** @type {MirrorTupleWith<Paths, HTMLImageElement>} */ (resultValue),
  ];
}

/**
 * @param {string} stylesPath
 * @param {CleanUpManager} [cleanUpManager]
 *
 * @example
 * ```js
 * const stylesheetLink = addStylesHead(
 * 		import.meta.resolve("./__style.css", new URL(import.meta.url)),
 * )
 *```
 */
export function injectStylesheetLink(stylesPath, cleanUpManager) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = stylesPath;
  document.head.appendChild(link);
  cleanUpManager?.register(() => {
    link.remove();
  });
  return link;
}
