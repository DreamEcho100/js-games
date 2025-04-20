import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom.js";
import { resolveBaseImportUrl } from "#libs/urls.js";

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
    {
      type: "image",
      src: import.meta.resolve(
        "./assets/images/raven.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: resolveBaseImportUrl(
        "#assets/audios/Magic SFX Preview Pack/Fire impact 1.wav",
      ),
    },
    {
      type: "audio",
      src: resolveBaseImportUrl(
        "#assets/audios/Magic SFX Preview Pack/Healing Full.wav",
      ),
    },
    {
      type: "audio",
      src: resolveBaseImportUrl(
        "#assets/audios/Magic SFX Preview Pack/Ice attack 2.wav",
      ),
    },
    {
      type: "audio",
      src: resolveBaseImportUrl(
        "#assets/audios/Magic SFX Preview Pack/Misc 02.wav",
      ),
    },
    {
      type: "audio",
      src: resolveBaseImportUrl(
        "#assets/audios/Magic SFX Preview Pack/Wind effects 5.wav",
      ),
    },
  ]),
  cb: ({
    // assets,
    cleanUpManager,
    createLayout,
  }) => {
    // const [explosionImage, ...sfxs] = assets;
    // const explosionImageSourceWidth = explosionImage.naturalWidth;
    // const explosionImageSourceHeight = explosionImage.naturalHeight;
    // const explosionFramesSize = 5;
    // const explosionImageDW = explosionImageSourceWidth / explosionFramesSize;
    // const explosionImageDH = explosionImageSourceHeight;
    // const explosionAnimationsStates = generateSpriteAnimationStates(
    // 	[{ name: "default", frames: 5 }],
    // 	{ width: explosionImageDW, height: explosionImageDH },
    // );

    let canvasBoundingBox = {
      width: 500,
      height: 700,
      top: 0,
      left: 0,
      right: 500,
      bottom: 700,
      x: 0,
      y: 0,
    };

    createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${canvasBoundingBox.width}"
			height="${canvasBoundingBox.height}"
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
    if (!ctx) {
      throw new Error("Couldn't get the canvas context!");
    }

    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasBoundingBox = boundingBox;
      },
    });
    cleanUpManager.register(adjustCanvasCleanup);

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(0, 0, canvasBoundingBox.width, canvasBoundingBox.height);

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
