/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/** @import { SpriteInfoInput, SpriteInfo } from "#libs/types/core.js"; */

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { resolveBaseImportUrl } from "#libs/urls.js";

/*

TODO:
- [ ] Add another canvas to be used as a per raven hit-box color detection
- [ ] On hit-box/raven click, play the sound and show the explosion animation, increase the score, and off the raven to be reused
- [ ] Add a score counter
- [ ] Add a timer to spawn new ravens
- [ ] Add a raven spawn rate
*/

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
  stylesheetLink: import.meta.resolve(
    "./assets/styles/index.css",
    new URL(import.meta.url),
  ),
  cb: ({ appId, assets, cleanUpManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;
    const canvas2Id = `${appId}-canvas2`;
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

    createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small>
			<div class=" mx-auto max-w-full w-5xl relative">
				<canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 max-w-full"
			></canvas>
			</div>
		`);

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
        canvasConfig.dom = boundingBox;
        canvasConfig.render.width = boundingBox.width;
        canvasConfig.render.height = boundingBox.height;
      },
    });
    cleanUpManager.register(adjustCanvasCleanup);

    let gameFrame = 0;
    let score = 0;

    console.log("___ canvasConfig", canvasConfig, canvas);
    cleanUpManager.registerEventListener({
      elem: canvas,
      type: "click",
      listener: (e) => {
        const posX = e.pageX - canvasConfig.dom.x;
        const posY = e.pageY - canvasConfig.dom.y;

        console.log("___ posX", posX);
        console.log("___ posY", posY);
        const detectPixelColor = ctx.getImageData(posX, posY, 1, 1);
        console.log("___ detectPixelColor", detectPixelColor);
      },
    });

    function drawScore() {
      ctx.fillStyle = "white";
      ctx.font = "14px Impact";
      ctx.fillText(`Score: ${score}`, 7, 21);
      ctx.fillStyle = "black";
      ctx.font = "14px Impact";
      ctx.fillText(`Score: ${score}`, 5, 20);
    }

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

        this.x = props.x;
        this.y = props.y;

        this.frameInterval = 0;
        this.dx = 0;
        this.dy = 0;
        this.recalculateMotionParameters();
        /** @type {"not-in-screen" | "in-screen" | "was-in-screen"} */
        this.state = "not-in-screen";
      }
      recalculateMotionParameters() {
        this.frameInterval = Math.floor(Math.random() * 5 + 2.5);
        this.dx = Math.random() * 1.24 + (8 - this.frameInterval) * 0.5;
        this.dy = Math.random() * 1.24 + (8 - this.frameInterval) * 0.5;
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
      }
      update() {
        this.x -= this.dx;
        this.y += this.dy;

        if (this.state === "in-screen") {
          if (
            this.y < this.height * 0.1 ||
            this.y > canvasConfig.render.height * 0.9
          ) {
            this.dy = -this.dy;
          }
        }

        const isOffScreen =
          this.x + this.width < 0 || // fully out on the left
          this.y + this.height < 0 || // above the top
          this.y > canvasConfig.render.height; // below the bottom

        if (isOffScreen) {
          if (this.state === "in-screen") {
            this.x =
              canvasConfig.render.width +
              canvasConfig.render.width * Math.floor(Math.random() * 5) +
              this.width * Math.floor(Math.random() * 5);
            this.y =
              canvasConfig.render.height * 0.25 +
              Math.random() * canvasConfig.render.height * 0.4;
            this.recalculateMotionParameters();
          } else {
            this.state = "not-in-screen";
          }
        } else {
          if (this.state === "not-in-screen") {
            this.state = "in-screen";
          }
          // Animation sprite
          const animationState =
            this.sprite.animationStates[this.sprite.currentAnimationState];

          if (gameFrame % this.frameInterval === 0) {
            this.sprite.currentFrameX =
              this.sprite.currentFrameX >= animationState.size - 1
                ? 0
                : this.sprite.currentFrameX + 1;
          }
        }
      }
    }

    const ravensMaxSize = 10;
    /** @type {Raven[]} */
    let ravens = new Array(ravensMaxSize);

    for (let i = 0; i < ravensMaxSize; i++) {
      const prevRaven = i > 0 ? ravens[i - 1] : null;
      const raven = new Raven({
        x:
          // Make sure the raven is not too close to the previous one
          (prevRaven?.x
            ? (prevRaven.x + canvasConfig.render.width) * Math.random() +
              prevRaven.width
            : 0) +
          canvasConfig.render.width * 1.5 +
          Math.random() * canvasConfig.render.width +
          10 +
          (prevRaven ? prevRaven.width * (Math.random() * 6) : 0),
        y:
          canvasConfig.render.height * 0.25 +
          Math.random() * canvasConfig.render.height * 0.4,
        sprite: {
          img: ravenImage,
          animationStates: ravenAnimationsStates,
          currentAnimationState: "default",
          renderBaseWidth: 80,
          width: ravenMetadata.width,
          height: ravenMetadata.height,
        },
        // sfx: sfxs[0],
        sfx: sfxs[Math.floor(Math.random() * sfxs.length)],
      });

      if (raven.y > canvasConfig.render.height * 0.5) {
        raven.dy = -1 * Math.random() * 2 - 0.5;
      } else {
        raven.dy = Math.random() * 2 - 0.5;
      }
      ravens[i] = raven;
    }

    let timeToNextRaven = 0;
    let ravenInterval = 5000;
    let lastInterval = 0;

    /** @type {number|undefined} */
    let animateId;

    /** @param {DOMHighResTimeStamp}time */
    function animate(time) {
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      drawScore();
      for (const raven of ravens) {
        raven.update();
        raven.draw();
      }

      gameFrame++;
      animateId = requestAnimationFrame(animate);
    }

    cleanUpManager.register(() => {
      if (!animateId) {
        return;
      }
      cancelAnimationFrame(animateId);
    });

    animate(0);
  },
});

export default gameScreen;
