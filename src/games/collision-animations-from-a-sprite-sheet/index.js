import initGameScreen from "#libs/core/dom.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";

const gameScreen = await initGameScreen({
  assetsUrls: /** @type {const} */ ([
    import.meta.resolve("./boom.png", new URL(import.meta.url)),
  ]),
  cb: ({ assets, cleanUpManager, createLayout }) => {
    const [explosionImage] = assets;
    const explosionImageSourceWidth = explosionImage.naturalWidth;
    const explosionImageSourceHeight = explosionImage.naturalHeight;
    const explosionFramesSize = 5;
    const explosionImageDW = explosionImageSourceWidth / explosionFramesSize;
    const explosionImageDH = explosionImageSourceHeight;
    const explosionAnimationsStates = generateSpriteAnimationStates(
      [{ name: "default", frames: 5 }],
      { width: explosionImageDW, height: explosionImageDH },
    );
    /** @type {keyof typeof explosionAnimationsStates} */
    let currentAnimation = "idle";
    const canvasSizes = { width: 600, height: 600 };

    createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${canvasSizes.width}"
			height="${canvasSizes.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>`);

    const canvas = /** @type {HTMLCanvasElement|null} */ (
      document.getElementById("vanillaJavascriptSpriteAnimationTechniques")
    );

    if (!canvas) {
      throw new Error("Couldn't find the canvas!");
    }

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );

    let staggerFrame = 5;
    let frameAcc = 0;

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);

      animateId = requestAnimationFrame(animate);
    }

    cleanUpManager.register(() => {
      if (!animateId) {
        return;
      }
      cancelAnimationFrame(animateId);
    });

    animate();
  },
});

export default gameScreen;
