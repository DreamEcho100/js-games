/**
 * @import { TLoadAsset, TElementTypeMapperForAssets, TResult } from "#libs/types/common.js";
 * @import { CleanUpManager } from "./cleanup";
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _commonTypes from "#libs/types/common.js";

/**
 * Loads an image from a given source and returns its dimensions.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<TResult<HTMLImageElement>>}
 */
export async function loadOneImageElement(src) {
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
 * Loads an image from a given source and returns its dimensions.
 * @param {string} src - The source URL of the audio.
 * @returns {Promise<TResult<HTMLAudioElement>>}
 */
export async function loadOneAudioElement(src) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    audio.onloadeddata = function (_event) {
      // Once the audio is loaded, resolve the promise with its natural dimensions.
      resolve([null, audio]);
    };

    audio.onerror = function (error) {
      // Reject the promise if the image fails to load.
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : `Error loading as audio: ${src}`;

      resolve([new Error(`Failed to load image at ${src}: ${message}`), null]);
    };

    audio.src = src;
  });
}

/**
 * Preloads multiple assets in parallel using your existing createImage.
 * Supports both images and audio for now.
 *
 * @template {TLoadAsset[]} TAssetsInfo
 * @param {TAssetsInfo} assetsInfo
 * @returns {Promise<TResult<TElementTypeMapperForAssets<TAssetsInfo>>>}
 */
export async function loadManyAssets(assetsInfo) {
  const entries = await Promise.all(
    assetsInfo.map(async (asset) => {
      if (asset.type === "image") {
        const [err, result] = await loadOneImageElement(asset.src);
        if (err) {
          return /** @type {const} */ ([
            new Error(`Failed to preload ${asset.src}: ${err.message}`),
            null,
          ]);
        }
        return /** @type {const} */ ([null, result]);
      } else if (asset.type === "audio") {
        const [err, result] = await loadOneAudioElement(asset.src);
        if (err) {
          return /** @type {const} */ ([
            new Error(`Failed to preload ${asset.src}: ${err.message}`),
            null,
          ]);
        }
        return /** @type {const} */ ([null, result]);
      }
      return /** @type {const} */ ([new Error("Unknown asset type"), null]);
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
    /** @type {TElementTypeMapperForAssets<TAssetsInfo>} */ (resultValue),
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
