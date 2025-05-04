/**
 * @import { TLoadAsset, TElementTypeMapperForAssets, TResult } from "#libs/types/common.js";
 * @import { CleanupManager } from "../cleanup";
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _commonTypes from "#libs/types/common.js";
import { limitDecimalPlaces } from "../math";

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

export class CanvasConfig {
  /**
   * @type {{ width?: number; height?: number }|null}
   */
  renderMaxSize = null;
  /**
   * @type {{ width?: number; height?: number }|null}
   */
  domMaxSize = null;

  /**
   * The type of scaling to apply.
   * - "fit": this will ensure that all screens will see all of the native play screen size, but some displays will have extra play field on the sides or top and bottom.
   * - "fill": This will ensure that the scale fills the device but will crop, some of the top and bottom, or left and right of the play field.
   *
   * @type {"fit"|"fill"}
   */
  scaleType = "fit";

  /** @type {[number, number]} */
  scale = [1, 1];

  /**
   *
   * @param {{
   * 	 maxSize?: { width?: number; height?: number };
   * 	 renderMax?: { width?: number; height?: number };
   *   domMax?: { width?: number; height?: number };
   *   size?: {
   *       width: number;
   *       height: number;
   *   };
   *   render?: {
   *       width?: number;
   *       height?: number;
   *   };
   *   dom?: {
   *       width?: number;
   *       height?: number;
   *       top?: number;
   *       left?: number;
   *       right?: number;
   *       bottom?: number;
   *       x?: number;
   *       y?: number;
   *   };
   * }} initialConfig
   */
  constructor(initialConfig) {
    this.renderMaxSize =
      initialConfig.renderMax ?? initialConfig.maxSize ?? null;

    const initialRenderWidth =
      initialConfig.render?.width ?? initialConfig.size?.width;
    const initialRenderHeight =
      initialConfig.render?.height ?? initialConfig.size?.height;

    if (!initialRenderWidth || !initialRenderHeight) {
      throw new Error(
        "Render width and height must be provided in the initialConfig.",
      );
    }

    const renderWidth = this.renderMaxSize?.width
      ? Math.min(this.renderMaxSize.width, initialRenderWidth)
      : initialRenderWidth;
    const renderHeight = this.renderMaxSize?.height
      ? Math.min(this.renderMaxSize.height, initialRenderHeight)
      : initialRenderHeight;

    this.render = {
      width: renderWidth,
      height: renderHeight,
    };

    const initialDomWidth =
      initialConfig.dom?.width ??
      initialConfig.size?.width ??
      initialRenderWidth;
    const initialDomHeight =
      initialConfig.dom?.height ??
      initialConfig.size?.height ??
      initialRenderHeight;
    if (!initialDomWidth || !initialDomHeight) {
      throw new Error(
        "DOM width and height must be provided in the initialConfig.",
      );
    }

    this.domMaxSize =
      initialConfig.domMax || initialConfig.maxSize
        ? {
            width: initialConfig.domMax?.width ?? initialConfig.maxSize?.width,
            height:
              initialConfig.domMax?.height ?? initialConfig.maxSize?.height,
          }
        : null;

    const domWidth = this.domMaxSize?.width
      ? Math.min(this.domMaxSize.width, initialDomWidth)
      : initialDomWidth;
    const domHeight = this.domMaxSize?.height
      ? Math.min(this.domMaxSize.height, initialDomHeight)
      : initialDomHeight;

    /**
     * The canvas bounding box is the bounding box of the canvas element
     * in the DOM. It is used to calculate the position of the canvas element
     * in the DOM and to adjust its size.
     */
    this.dom = {
      width: domWidth,
      height: domHeight,
      top: initialConfig.dom?.top ?? 0,
      left: initialConfig.dom?.left ?? 0,
      right: initialConfig.dom?.right ?? domWidth,
      bottom: domHeight,
      x: initialConfig.dom?.x ?? 0,
      y: initialConfig.dom?.y ?? 0,
    };
    this.initial = {
      render: { ...this.render },
      renderAspectRatio: this.render.width / this.render.height,
      renderMaxSize: this.renderMaxSize ? { ...this.renderMaxSize } : null,
      dom: { ...this.dom },
      domAspectRatio: this.dom.width / this.dom.height,
    };
  }

  /**
   * @param {{
   *   width?: number;
   *   height?: number;
   *   top?: number;
   *   left?: number;
   *   right?: number;
   *   bottom?: number;
   *   x?: number;
   *   y?: number;
   * }} newConfig
   */
  updateDomConfig(newConfig) {
    let newWidth = this.domMaxSize?.width
      ? Math.min(this.domMaxSize.width, newConfig.width ?? this.dom.width)
      : newConfig.width ?? this.dom.width;
    let newHeight = this.domMaxSize?.height
      ? Math.min(this.domMaxSize.height, newConfig.height ?? this.dom.height)
      : newConfig.height ?? this.dom.height;

    let domWidth = newWidth;
    let domHeight = newHeight;

    if (this.scaleType === "fit") {
      this.scale[0] = this.scale[1] = Math.min(
        newWidth / this.initial.render.width,
        newHeight / this.initial.render.height,
      );
      domWidth = this.initial.render.width * this.scale[0];
      domHeight = this.initial.render.height * this.scale[0];
    } else if (this.scaleType === "fill") {
      this.scale[0] = this.scale[1] = Math.max(
        newWidth / this.initial.render.width,
        newHeight / this.initial.render.height,
      );
      domWidth = this.initial.render.width * this.scale[0];
      domHeight = this.initial.render.height * this.scale[0];
    } else {
      throw new Error(`Invalid scale type "${this.scaleType}".`);
    }

    this.dom.width = domWidth;
    this.dom.height = domHeight;
    this.dom.top = newConfig.top ?? this.dom.top;
    this.dom.left = newConfig.left ?? this.dom.left;
    this.dom.right = newConfig.right ?? this.dom.right;
    this.dom.bottom = newConfig.bottom ?? this.dom.bottom;
    this.dom.x = newConfig.x ?? this.dom.x;
    this.dom.y = newConfig.y ?? this.dom.y;

    return this;
  }

  /**
   * @template {HTMLCanvasElement|undefined} [TCanvas=undefined]
   * @template {CanvasRenderingContext2D|undefined} [TCtx=undefined]
   *
   * @param {object} [options={}]
   *
   * @param {boolean} [options.shouldUpdateSize=true] - Whether to update the size of the canvas.
   *
   * @param {TCanvas} [options.canvas] - The canvas element to adjust.
   * @param {TCanvas extends HTMLCanvasElement ? ("setSize"|"setStyleWidth"|"setStyleHeight"|"setStyleSize"|boolean|undefined|null)[] : undefined} [options.canvasActions] - The canvas actions to perform.
   *
   * @param {TCtx} [options.ctx] - The canvas context to adjust.
   * @param {TCtx extends CanvasRenderingContext2D ? ("setScale"|"scaleBasedImageSmoothing"|boolean|undefined|null)[] : undefined} [options.ctxActions] - The canvas actions to perform.
   *
   * @references
   * - [Scaling a Javascript Canvas Game Properly](https://stackoverflow.com/a/33517425/13961420)
   */
  adjustRenderScale({ shouldUpdateSize = true, ...options } = {}) {
    const newWidth = this.initial.render.width * this.scale[0];
    const newHeight = this.initial.render.height * this.scale[0];

    const renderWidth = this.renderMaxSize?.width
      ? Math.min(this.renderMaxSize.width, newWidth)
      : newWidth;
    const renderHeight = this.renderMaxSize?.height
      ? Math.min(this.renderMaxSize.height, newHeight)
      : newHeight;

    if (newWidth === this.render.width || newHeight === this.render.height) {
      return [
        renderWidth / this.initial.render.width,
        renderHeight / this.initial.render.height,
      ];
    }

    if (options.canvas && options.canvasActions) {
      const { canvas, canvasActions } = options;
      for (const action of canvasActions) {
        switch (action) {
          case "setSize":
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            break;
          case "setStyleSize":
            canvas.style.width = `${renderWidth}px`;
            canvas.style.height = `${renderHeight}px`;
            break;
          case "setStyleWidth":
            canvas.style.width = `${renderWidth}px`;
            break;
          case "setStyleHeight":
            canvas.style.height = `${renderHeight}px`;
            break;
          default:
            throw new Error(`Unknown canvas action: ${action}`);
        }
      }
    }

    if (options.ctx && options.ctxActions) {
      const { ctx, ctxActions } = options;
      for (const action of ctxActions) {
        switch (action) {
          case "setScale":
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
            ctx.scale(this.scale[0], this.scale[1]);
            break;
          case "scaleBasedImageSmoothing":
            if (this.scale[0] < 1) {
              ctx.imageSmoothingEnabled = true; // turn it on for low res screens
            } else {
              ctx.imageSmoothingEnabled = false; // turn it off for high res screens.
            }
            break;
        }
      }
    }

    if (!shouldUpdateSize) {
      this.render.width = renderWidth;
      this.render.height = renderHeight;
    }

    // return [
    //   renderWidth / this.initial.render.width,
    //   renderHeight / this.initial.render.height,
    // ];
  }
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
 *  }, isInitial: boolean) => void;
 *  debounce?: number;
 *  approach?: "continue-preserve-dpr" // | "preserve-size"
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
    width: canvas.width,
    height: canvas.height,
    top: 0,
    left: 0,
    right: canvas.width,
    bottom: canvas.height,
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

  function handlePreserveDpr() {
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = limitDecimalPlaces(canvasDOMConfig.width * dpr, 2);
    canvas.height = limitDecimalPlaces(canvasDOMConfig.height * dpr, 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);
  }

  let counter = 0;

  /**
   * @param {boolean} [isInitial=false]
   */
  const updateCanvasSize = (isInitial = false) => {
    isResizeManual = true;
    const boundingBox = canvas.getBoundingClientRect();
    counter++;

    if (isInitial) {
      console.log("Initial canvas size:", counter);
    } else {
      console.log("Updated canvas size:", counter);
    }

    if (approach === "continue-preserve-dpr") {
      handlePreserveDpr();
    }

    // else if (approach === "preserve-size") {
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

    canvasDOMConfig.width = limitDecimalPlaces(boundingBox.width, 2);
    canvasDOMConfig.height = limitDecimalPlaces(boundingBox.height, 2);
    canvasDOMConfig.top = limitDecimalPlaces(boundingBox.top, 2);
    canvasDOMConfig.left = limitDecimalPlaces(boundingBox.left, 2);
    canvasDOMConfig.right = limitDecimalPlaces(boundingBox.right, 2);
    canvasDOMConfig.bottom = limitDecimalPlaces(boundingBox.bottom, 2);
    canvasDOMConfig.x = limitDecimalPlaces(boundingBox.x, 2);
    canvasDOMConfig.y = limitDecimalPlaces(boundingBox.y, 2);

    onUpdateCanvasSize(canvasDOMConfig, isInitial);
  };
  handlePreserveDpr();
  updateCanvasSize(true);

  styleSheet.innerHTML = `
    		[data-${canvasDataId}] {
    			width: ${canvasDOMConfig.width}px;
    			/* height: ${canvasDOMConfig.height}px; */
    			aspect-ratio: ${limitDecimalPlaces(
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
      "computedStyleMap" in canvas
        ? canvas.computedStyleMap().get("box-sizing")
        : undefined
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
