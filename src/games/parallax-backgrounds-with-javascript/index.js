/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

import { CleanUpManager } from "#libs/cleanup.js";
import { loadManyImageElement } from "#libs/dom.js";
import { clamp } from "#libs/math.js";

/** @param {ScreenHandlerParams} props */
export default async function vanillaJavascriptSpriteAnimationTechniques(
  props,
) {
  const appId = `app-${Math.random().toString(32)}`;
  const goBackButtonId = `go-back-${appId}`;
  const canvasId = `canvas-${appId}`;

  const cleanUpManager = new CleanUpManager();

  function goBack() {
    props.handleGoPrevScreen?.();
    cleanUpManager.cleanUp();
  }

  props.appElem.innerHTML = `
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;

  const [assetsError, assets] = await loadManyImageElement(
    /** @type {const} */ ([
      import.meta.resolve(
        "./backgroundLayers/layer-1.png",
        new URL(import.meta.url),
      ),
      import.meta.resolve(
        "./backgroundLayers/layer-2.png",
        new URL(import.meta.url),
      ),
      import.meta.resolve(
        "./backgroundLayers/layer-3.png",
        new URL(import.meta.url),
      ),
      import.meta.resolve(
        "./backgroundLayers/layer-4.png",
        new URL(import.meta.url),
      ),
      import.meta.resolve(
        "./backgroundLayers/layer-5.png",
        new URL(import.meta.url),
      ),
    ]),
  );

  if (assetsError) {
    console.error(assetsError);
    props.appElem.innerHTML = /* HTML */ `<section
      class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${props.handleGoPrevScreen
        ? `<button id="${goBackButtonId}">Go Back</button><br /><br />`
        : ""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`;
    cleanUpManager.registerEventListener({
      elem: document.getElementById(goBackButtonId),
      type: "click",
      listener: goBack,
      silent: process.env.NODE_ENV !== "production",
    });
    cleanUpManager.registerEventListener({
      elem: document.getElementById("reload"),
      type: "click",
      listener: () => {
        props.appElem.innerHTML = "";
        vanillaJavascriptSpriteAnimationTechniques(props);
      },
    });
    return;
  }

  const minGameSpeed = 1;
  const maxGameSpeed = 20;
  let gameSpeed = 5;
  const speedIndicatorId = `showGameSpeed-${appId}`;
  const gameSpeedInputId = `gameSpeed-${appId}`;

  const canvasSizes = { width: 800, height: 700 };
  props.appElem.innerHTML = /* html */ `
	<section class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${
      props.handleGoPrevScreen
        ? `<button id="${goBackButtonId}">Go Back</button>`
        : ""
    }
		<canvas
			id="${canvasId}"
			width="${canvasSizes.width}"
			height="${canvasSizes.height}"
			class="border-2 border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div class="flex flex-col gap-4">
			<label>Game speed: <span id="${speedIndicatorId}">${gameSpeed}</span></label>
			<input type="range" id="${gameSpeedInputId}" min="${minGameSpeed}" max="${maxGameSpeed}" value="${gameSpeed}" />
		</div>
	</section>
	`;

  const gameSpeedIndicator = /** @type {HTMLSpanElement} */ (
    document.getElementById(speedIndicatorId)
  );
  const gameSpeedInput = /** @type {HTMLInputElement} */ (
    document.getElementById(gameSpeedInputId)
  );
  cleanUpManager.registerEventListener({
    elem: gameSpeedInput,
    type: "input",
    listener: (event) => {
      const value = clamp(
        Number(/** @type {HTMLInputElement} */ (event.target).value),
        minGameSpeed,
        maxGameSpeed,
      );

      gameSpeed = value;
      gameSpeedIndicator.innerText = gameSpeed.toString();
    },
  });

  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById(canvasId)
  );

  if (!canvas) {
    throw new Error("Couldn't find the canvas element!");
  }

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

  if (!ctx) {
    throw new Error("Couldn't get the canvas context!");
  }

  cleanUpManager.registerEventListener({
    elem: document.getElementById(goBackButtonId),
    type: "click",
    listener: goBack,
    silent: process.env.NODE_ENV !== "production",
  });

  /*
	// Approach 3
	let gameFrame = 0;
	*/
  const [bgLayer1, bgLayer2, bgLayer3, bgLayer4, bgLayer5] = assets;

  class Layer {
    /**
     * @param {HTMLImageElement} img
     * @param {number} speedModifier
     */
    constructor(img, speedModifier) {
      this.x1 = 0;
      this.y = 0;
      this.width = img.naturalWidth;
      this.height = img.naturalHeight;
      /*
			// Approach 1
			this.x2 = 0;
			*/
      this.img = img;
      this.speedModifier = speedModifier;
      this.speed = gameSpeed * this.speedModifier;
    }

    update() {
      this.speed = gameSpeed * this.speedModifier;
      /*
			// Approach 1

			if (this.x1 < -this.width) {
				this.x1 = this.width + this.x2 - this.speed;
			}
			if (this.x2 < -this.width) {
				this.x2 = this.width + this.x1 - this.speed;
			}

			this.x1 = Math.floor(this.x1 - this.speed);
			this.x2 = Math.floor(this.x2 - this.speed);
			*/

      // /*
      // Approach 2

      if (this.x1 <= -this.width) {
        this.x1 = 0;
      }

      this.x1 = Math.floor(this.x1 - this.speed);
      // */

      /*
			// Approach 3
			this.x1 = (-gameFrame * this.speed) % this.width;
			*/
    }

    draw() {
      /*
			// Approach 1

			ctx.drawImage(this.img, this.x1, 0);
			ctx.drawImage(this.img, this.x2, 0);
			*/

      // Approach 2 and 3

      ctx.drawImage(this.img, this.x1, 0);
      ctx.drawImage(this.img, this.x1 + this.width, 0);
    }
  }

  const layers = [
    new Layer(bgLayer1, 0.2),
    new Layer(bgLayer2, 0.4),
    new Layer(bgLayer3, 0.6),
    new Layer(bgLayer4, 0.8),
    new Layer(bgLayer5, 1),
  ];

  /** @type {number|undefined} */
  let animateId;
  function animate() {
    ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);

    for (const layer of layers) {
      layer.update();
      layer.draw();
    }

    /*
		// Approach 3
		gameFrame++;
		*/
    animateId = requestAnimationFrame(animate);
  }

  cleanUpManager.register(() => {
    if (!animateId) {
      return;
    }
    cancelAnimationFrame(animateId);
  });

  animate();
}
