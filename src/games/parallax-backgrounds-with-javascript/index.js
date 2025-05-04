import { clamp } from "#libs/math.js";

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas, CanvasConfig } from "#libs/dom/index.js";

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
    {
      type: "image",
      src: import.meta.resolve(
        "./backgroundLayers/layer-1.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "image",
      src: import.meta.resolve(
        "./backgroundLayers/layer-2.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "image",
      src: import.meta.resolve(
        "./backgroundLayers/layer-3.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "image",
      src: import.meta.resolve(
        "./backgroundLayers/layer-4.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "image",
      src: import.meta.resolve(
        "./backgroundLayers/layer-5.png",
        new URL(import.meta.url),
      ),
    },
  ]),
  cb: async ({ appId, assets, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const minGameSpeed = 1;
    const maxGameSpeed = 20;
    let gameSpeed = 5;
    const speedIndicatorId = `${appId}-show-game-speed`;
    const gameSpeedInputId = `${appId}-game-speed`;

    const canvasConfig = new CanvasConfig({
      size: { width: 800, height: 700 },
      maxSize: { width: 1024 },
    });

    await createLayout(/* html */ `<canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700  mx-auto w-full"
				style="max-width: ${canvasConfig.initial.renderMaxSize?.width}px;"
			></canvas>
			<div class="flex flex-col gap-4">
				<label>Game speed: <span id="${speedIndicatorId}">${gameSpeed}</span></label>
				<input type="range" id="${gameSpeedInputId}" min="${minGameSpeed}" max="${maxGameSpeed}" value="${gameSpeed}" />
			</div>`);

    const gameSpeedIndicator = /** @type {HTMLSpanElement} */ (
      document.getElementById(speedIndicatorId)
    );
    const gameSpeedInput = /** @type {HTMLInputElement} */ (
      document.getElementById(gameSpeedInputId)
    );
    cleanupManager.registerEventListener({
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

    const canvas = /** @type {HTMLCanvasElement|null} */ (
      document.getElementById(canvasId)
    );
    if (!canvas) {
      throw new Error("Couldn't find the canvas!");
    }

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );
    if (!ctx) {
      throw new Error("Couldn't get the canvas context!");
    }

    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasConfig.updateDomConfig(boundingBox).adjustRenderScale({
          ctx,
          ctxActions: ["scaleBasedImageSmoothing", "setScale"],
          canvas,
          canvasActions: ["setSize", "setStyleWidth"],
        });
      },
    });
    cleanupManager.register(adjustCanvasCleanup);

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
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

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

    cleanupManager.register(() => {
      if (!animateId) {
        return;
      }
      cancelAnimationFrame(animateId);
    });

    animate();
  },
});

export default gameScreen;
