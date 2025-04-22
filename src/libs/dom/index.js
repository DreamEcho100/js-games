/**
 * @import { TLoadAsset, TElementTypeMapperForAssets, TResult } from "#libs/types/common.js";
 * @import { CleanupManager } from "../cleanup";
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _commonTypes from "#libs/types/common.js";
import { roundToPrecision } from "../math";

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
 * @param {CleanupManager} [cleanupManager]
 *
 * @example
 * ```js
 * const stylesheetLink = addStylesHead(
 * 		import.meta.resolve("./__style.css", new URL(import.meta.url)),
 * )
 *```
 */
export function injectStylesheetLink(stylesPath, cleanupManager) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = stylesPath;
  document.head.appendChild(link);
  cleanupManager?.register(() => {
    link.remove();
  });
  return link;
}

/**
 * @param {{
 * canvas:HTMLCanvasElement;
 * ctx:CanvasTransform;
 * onUpdateCanvasSize: (boundingBox: {
 *   width: number;
 *   height: number;
 *   top: number;
 *   left: number;
 *   right: number;
 *   bottom: number;
 *   x: number;
 *   y: number;
 *  }) => void;
 *  debounce?: number;
 *  approach?: "preserve-dpr" // | "preserve-size"
 * }} props
 */
export function adjustCanvas({
  canvas,
  ctx,
  onUpdateCanvasSize,
  debounce = 10,
  approach,
}) {
  let isResizeManual = false;
  /** @type {(() => void)[]} */
  const cleanupItems = [];
  const canvasDOMConfig = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
  };
  const canvasDataId = Math.random().toString(36).slice(2);
  const styleSheet = document.createElement("style");
  styleSheet.id = `style-${canvasDataId}`;
  document.head.appendChild(styleSheet);
  cleanupItems.push(() => {
    styleSheet.remove();
  });
  canvas.setAttribute(`data-${canvasDataId}`, "true");

  const updateCanvasSize = () => {
    isResizeManual = true;
    const boundingBox = canvas.getBoundingClientRect();

    // const dpr = window.devicePixelRatio || 1;
    // canvas.width = roundToPrecision(boundingBox.width * dpr, 2);
    // canvas.height = roundToPrecision(boundingBox.height * dpr, 2);
    // ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    // ctx.scale(dpr, dpr);

    if (approach === "preserve-dpr") {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = roundToPrecision(boundingBox.width * dpr, 2);
      canvas.height = roundToPrecision(boundingBox.height * dpr, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.scale(dpr, dpr);
    }
    // else if (approach === "preserve-size") {
    //   canvas.width = roundToPrecision(boundingBox.width, 2);
    //   canvas.height = roundToPrecision(boundingBox.height, 2);
    //   ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    //   ctx.scale(1, 1);
    // }

    // // update the canvas stylesheet
    // styleSheet.innerHTML = `
    // 		[data-${canvasDataId}] {
    // 			width: ${boundingBox.width}px;
    // 			/* height: ${boundingBox.height}px; */
    // 			aspect-ratio: ${roundToPrecision(
    //         boundingBox.width / boundingBox.height,
    //         2,
    //       )};
    // 		}
    // 	`;

    canvasDOMConfig.width = roundToPrecision(boundingBox.width, 2);
    canvasDOMConfig.height = roundToPrecision(boundingBox.height, 2);
    canvasDOMConfig.top = roundToPrecision(boundingBox.top, 2);
    canvasDOMConfig.left = roundToPrecision(boundingBox.left, 2);
    canvasDOMConfig.right = roundToPrecision(boundingBox.right, 2);
    canvasDOMConfig.bottom = roundToPrecision(boundingBox.bottom, 2);
    canvasDOMConfig.x = roundToPrecision(boundingBox.x, 2);
    canvasDOMConfig.y = roundToPrecision(boundingBox.y, 2);

    canvas.width = canvasDOMConfig.width;
    canvas.height = canvasDOMConfig.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(1, 1);

    onUpdateCanvasSize(canvasDOMConfig);
  };
  updateCanvasSize();

  styleSheet.innerHTML = `
    		[data-${canvasDataId}] {
    			width: ${canvasDOMConfig.width}px;
    			/* height: ${canvasDOMConfig.height}px; */
    			aspect-ratio: ${roundToPrecision(
            canvasDOMConfig.width / canvasDOMConfig.height,
            2,
          )};
    		}
    	`;

  /** @type {NodeJS.Timeout|undefined} */
  let resizeObserverTimeoutId;
  cleanupItems.push(() => {
    if (resizeObserverTimeoutId) {
      clearTimeout(resizeObserverTimeoutId);
      resizeObserverTimeoutId = undefined;
    }
  });

  const debouncedOnUpdateCanvasSize = () => {
    if (resizeObserverTimeoutId) {
      clearTimeout(resizeObserverTimeoutId);
    }

    if (isResizeManual) {
      isResizeManual = false;
      return;
    }

    resizeObserverTimeoutId = setTimeout(updateCanvasSize, debounce);
  };

  window.addEventListener("resize", debouncedOnUpdateCanvasSize);
  cleanupItems.push(() => {
    window.removeEventListener("resize", debouncedOnUpdateCanvasSize);
  });

  const canvasResizeObserver = new ResizeObserver(debouncedOnUpdateCanvasSize);
  cleanupItems.push(() => canvasResizeObserver.disconnect());

  const canvasBoxSizing = /** @type {"border-box"|"content-box"} */ (
    /** @type {{ value?: CanvasRenderingContext2D }} */ (
      canvas.computedStyleMap().get("box-sizing")
    )?.value ??
      getComputedStyle(canvas).boxSizing ??
      canvas.style.boxSizing
  );
  canvasResizeObserver.observe(canvas, {
    box: canvasBoxSizing,
  });

  return () => {
    for (const cleanupItem of cleanupItems) {
      cleanupItem();
    }
  };
}
