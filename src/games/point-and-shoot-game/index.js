/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/** @import { SpriteInfoInput, SpriteInfo } from "#libs/types/core.js"; */

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
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
      type: "image",
      src: resolveBaseImportUrl(
        "#games/collision-animations-from-a-sprite-sheet/assets/images/boom.png",
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
  cb: ({ assets, cleanUpManager, createLayout }) => {
    const [ravenImage, explosionImage, ...sfxs] = assets;

    const ravenMetadata = {
      framesX: 6,
      width: ravenImage.naturalWidth / 6,
      height: ravenImage.naturalHeight,
    };
    const ravenAnimationsStates = generateSpriteAnimationStates(
      [{ name: "default", frames: ravenMetadata.framesX }],
      {
        width: ravenMetadata.width,
        height: ravenMetadata.height,
      },
    );
    const explosionAnimationsMetadata = {
      framesX: 5,
      width: explosionImage.naturalWidth / 5,
      height: explosionImage.naturalHeight,
    };
    const explosionAnimationsStates = generateSpriteAnimationStates(
      [{ name: "default", frames: explosionAnimationsMetadata.framesX }],
      {
        width: explosionAnimationsMetadata.width,
        height: explosionAnimationsMetadata.height,
      },
    );

    const canvasConfig = {
      render: {
        width: 500,
        height: 700,
      },
      // The canvas bounding box is the bounding box of the canvas element
      // in the DOM. It is used to calculate the position of the canvas element
      // in the DOM and to adjust its size.
      dom: {
        width: 500,
        height: 700,
        top: 0,
        left: 0,
        right: 500,
        bottom: 700,
        x: 0,
        y: 0,
      },
    };

    createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${canvasConfig.render.width}"
			height="${canvasConfig.render.height}"
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
        canvasConfig.dom = boundingBox;
      },
    });
    cleanUpManager.register(adjustCanvasCleanup);

    /** @template {string} TSpriteAnimationName */
    class Raven {
      /**
       *
       * @param {{
       * 	x: number,
       * 	y: number,
       *  sprite: SpriteInfoInput<TSpriteAnimationName>
       *  sfx: HTMLAudioElement;
       * }} props
       */
      constructor(props) {
        const dimensions = scale2dSizeToFit({
          containerWidth: props.sprite.renderBaseWidth,
          containerHeight: props.sprite.renderBaseHeight,
          sourceWidth: props.sprite.width,
          sourceHeight: props.sprite.height,
        });
        /** @type {SpriteInfo<TSpriteAnimationName>} */
        this.sprite = {
          animationStates: props.sprite.animationStates,
          currentAnimationState: props.sprite.currentAnimationState,
          img: props.sprite.img,
          currentFrameX: 0,
          currentFrameY: 0,
          width: props.sprite.width,
          height: props.sprite.height,
        };
        this.width = dimensions.width;
        this.height = dimensions.height;

        this.x = canvasConfig.render.width;
        this.y = 0; // Math.random() * (canvasConfig.height - this.height);

        this.dx = Math.random() * 5 + 3;
        this.dy = Math.random() * 5 - 2.5;
      }
      draw() {
        ctx.fillStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(
          this.sprite.img,
          this.sprite.currentFrameX * this.sprite.width,
          this.sprite.currentFrameY * this.sprite.height,
          this.sprite.width,
          this.sprite.height,
          this.x,
          this.y,
          this.width,
          this.height,
        );

        if (this.x < -this.width) {
          this.x = canvasConfig.render.width;
        }

        if (this.y < 0 || this.y > canvasConfig.render.height - this.height) {
          this.dy *= -1;
        }
      }
      update() {
        this.x -= this.dx;
      }
    }

    const testRaven = new Raven({
      x: 0,
      y: 0,
      sprite: {
        img: ravenImage,
        animationStates: ravenAnimationsStates,
        currentAnimationState: "default",
        renderBaseWidth: 150,
        width: ravenMetadata.width,
        height: ravenMetadata.height,
      },
      sfx: sfxs[0],
    });

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      testRaven.draw();
      testRaven.update();

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
