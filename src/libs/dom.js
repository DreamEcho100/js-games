/**
 * @import { TLoadAsset, TElementTypeMapperForAssets, TResult } from "#libs/types/common.js";
 * @import { CleanUpManager } from "./cleanup";
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _commonTypes from "#libs/types/common.js";
import { roundToPrecision } from "./math";

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
 * }} props
 */
export function adjustCanvas({
  canvas,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx,
  onUpdateCanvasSize,
  debounce = 100,
}) {
  const initialCanvasBoundingBox = canvas.getBoundingClientRect();

  const canvasBoundingBox = {
    defaultWidth: canvas.width,
    defaultHeight: canvas.height,
    width: roundToPrecision(initialCanvasBoundingBox.width, 2),
    height: roundToPrecision(initialCanvasBoundingBox.height, 2),
    top: roundToPrecision(initialCanvasBoundingBox.top, 2),
    left: roundToPrecision(initialCanvasBoundingBox.left, 2),
    right: roundToPrecision(initialCanvasBoundingBox.right, 2),
    bottom: roundToPrecision(initialCanvasBoundingBox.bottom, 2),
    x: roundToPrecision(initialCanvasBoundingBox.x, 2),
    y: roundToPrecision(initialCanvasBoundingBox.y, 2),
  };

  canvas.width = canvasBoundingBox.defaultWidth;
  canvas.height = canvasBoundingBox.defaultHeight;

  const updateCanvasSize = () => {
    const boundingBox = canvas.getBoundingClientRect();
    // The following line is commented out because it was causing issues with the canvas size
    // Particularly when the canvas gets smaller it's cropping from the rendered canvas and not working will on resizing
    // const dpr = window.devicePixelRatio || 1;
    // canvas.width = roundToPrecision(boundingBox.width * dpr, 2);
    // canvas.height = roundToPrecision(boundingBox.height * dpr, 2);
    // ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    // ctx.scale(dpr, dpr);

    canvasBoundingBox.width = roundToPrecision(boundingBox.width, 2);
    canvasBoundingBox.height = roundToPrecision(boundingBox.height, 2);
    canvasBoundingBox.top = roundToPrecision(boundingBox.top, 2);
    canvasBoundingBox.left = roundToPrecision(boundingBox.left, 2);
    canvasBoundingBox.right = roundToPrecision(boundingBox.right, 2);
    canvasBoundingBox.bottom = roundToPrecision(boundingBox.bottom, 2);
    canvasBoundingBox.x = roundToPrecision(boundingBox.x, 2);
    canvasBoundingBox.y = roundToPrecision(boundingBox.y, 2);

    onUpdateCanvasSize(canvasBoundingBox);
  };
  updateCanvasSize();

  // The following line is commented out because it was causing issues with the canvas size
  // Particularly when the canvas gets smaller it's cropping from the rendered canvas and not working will on resizing
  // canvas.style.width = `${initialCanvasBoundingBox.width}px`;
  // canvas.style.height = `${initialCanvasBoundingBox.height}px`; // This will make the browser respect te aspect ratio based on te width
  canvas.style.aspectRatio = `${roundToPrecision(
    canvasBoundingBox.width / canvasBoundingBox.height,
    2,
  )}`;

  /** @type {(() => void)[]} */
  const cleanupItems = [];
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

    resizeObserverTimeoutId = setTimeout(updateCanvasSize, debounce);
  };

  const canvasResizeObserver = new ResizeObserver(debouncedOnUpdateCanvasSize);
  cleanupItems.push(() => canvasResizeObserver.disconnect());

  canvas.addEventListener("resize", debouncedOnUpdateCanvasSize);
  cleanupItems.push(() => {
    canvas.removeEventListener("resize", debouncedOnUpdateCanvasSize);
  });

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
  const bodyBoxSizing = /** @type {"border-box"|"content-box"} */ (
    /** @type {{ value?: CanvasRenderingContext2D }} */ (
      document.body.computedStyleMap().get("box-sizing")
    )?.value ??
      getComputedStyle(document.body).boxSizing ??
      document.body.style.boxSizing
  );
  canvasResizeObserver.observe(document.body, {
    box: bodyBoxSizing,
  });

  return () => {
    for (const cleanupItem of cleanupItems) {
      cleanupItem();
    }
  };
}
