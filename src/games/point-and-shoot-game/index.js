/** @import { SpriteInfoInput, SpriteInfo } from "#libs/types/core.js"; */

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { resolveBaseImportUrl } from "#libs/urls.js";

/**
 * Check if canvas pixel reading is blocked or spoofed (e.g., by Brave).
 */
function isCanvasReadBlocked() {
  const testCanvas = document.createElement("canvas");
  testCanvas.width = testCanvas.height = 1;
  const ctx = testCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Couldn't get the canvas context!");
  }
  ctx.fillStyle = "rgb(255, 0, 0)";
  ctx.fillRect(0, 0, 1, 1);
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  return !(
    pixel[0] === 255 &&
    pixel[1] === 0 &&
    pixel[2] === 0 &&
    pixel[3] === 255
  );
}

/*

TODO:
- [x] Add another canvas to be used as a per raven hit-box color detection
- [x] On hit-box/raven click:
 	- [x] Play the sound.
	- [x] Show the explosion animation.
	- [x] increase the score.
	- [x] Off the raven to be reused.
- [x] Add a score counter
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
        "#assets/audios/Magic SFX Preview Pack/Ice attack 2.wav",
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
    const [ravenImage, explosionImage, iceAttack2Sfx] = assets;

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
			<div class=" mx-auto max-w-full w-fit relative">
			<canvas
			id="${canvasId}"
			width="${canvasConfig.render.width}"
			height="${canvasConfig.render.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full"
			></canvas>
			<canvas
				id="${canvas2Id}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 max-w-full absolute top-0 left-0 opacity-0"
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

    const canvas2 = /** @type {HTMLCanvasElement|null} */ (
      document.getElementById(canvas2Id)
    );
    if (!canvas2) {
      throw new Error("Couldn't find the canvas!");
    }
    const ctx2 = /** @type {CanvasRenderingContext2D} */ (
      canvas2.getContext("2d", {
        willReadFrequently: true,
      })
    );
    if (!ctx2) {
      throw new Error("Couldn't get the canvas context!");
    }

    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasConfig.dom = boundingBox;
        canvasConfig.render.width = boundingBox.width;
        canvasConfig.render.height = boundingBox.height;

        canvas2.width = canvasConfig.render.width;
        canvas2.height = canvasConfig.render.height;
      },
    });
    cleanUpManager.register(adjustCanvasCleanup);

    let gameFrame = 0;
    let score = 0;
    let lives = 3;

    cleanUpManager.registerEventListener({
      elem: canvas2,
      type: "click",
      listener: (e) => {
        const posX = e.pageX - canvasConfig.dom.x;
        const posY = e.pageY - canvasConfig.dom.y;

        const detectPixelColor = ctx2.getImageData(posX, posY, 1, 1);

        for (const raven of ravens) {
          if (
            raven.color[0] === detectPixelColor.data[0] &&
            raven.color[1] === detectPixelColor.data[1] &&
            raven.color[2] === detectPixelColor.data[2]
          ) {
            score++;
            // Play the sound
            raven.sfx.currentTime = 0;
            raven.sfx.play();
            // Show the explosion animation
            raven.explosion.x = raven.x;
            raven.explosion.y = raven.y;
            raven.explosion.sprite.currentFrameX = 0;
            raven.explosion.frameInterval = 4;
            raven.resetPosition();
            raven.isHit = true;
            break;
          }
        }
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
    function drawLives() {
      ctx.fillStyle = "white";
      ctx.font = "14px Impact";
      // Should be under the score
      ctx.fillText(`Lives: ${lives}`, 7, 41);
      ctx.fillStyle = "black";
      ctx.font = "14px Impact";
      ctx.fillText(`Lives: ${lives}`, 5, 40);
    }
    function drawGameOver() {
      ctx.fillStyle = "white";
      ctx.font = "24px Impact";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Game Over`,
        canvasConfig.render.width * 0.5,
        canvasConfig.render.height * 0.5,
      );
      ctx.fillStyle = "black";
      ctx.font = "24px Impact";
      ctx.fillText(
        `Game Over`,
        canvasConfig.render.width * 0.5 - 1,
        canvasConfig.render.height * 0.5 - 1,
      );
    }

    /** @template {string} TSpriteAnimationName */
    class Explosion {
      /**
       * @param {{
       * 	x: number,
       * 	y: number,
       *  sprite: SpriteInfoInput<TSpriteAnimationName>
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
      }
      draw() {
        ctx.drawImage(
          this.sprite.img,
          this.sprite.currentFrameX * this.sprite.width,
          this.sprite.currentFrameY * this.sprite.height,
          this.sprite.width,
          this.sprite.height,
          this.x - this.width * 0.5,
          this.y - this.height * 0.5,
          this.width * 2,
          this.height * 2,
        );
      }
      update() {
        const animationState =
          this.sprite.animationStates[this.sprite.currentAnimationState];

        if (gameFrame % this.frameInterval === 0) {
          if (this.sprite.currentFrameX >= animationState.size - 1) {
            return;
          }
          this.sprite.currentFrameX =
            this.sprite.currentFrameX >= animationState.size - 1
              ? 0
              : this.sprite.currentFrameX + 1;
        }
      }
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
        this.color = /** @type {const} */ ([
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255),
          Math.floor(Math.random() * 255),
        ]);
        this.sfx = props.sfx;
        this.isHit = false;
        this.explosion = new Explosion({
          x: this.x,
          y: this.y,
          sprite: {
            img: explosionImage,
            animationStates: explosionAnimationsStates,
            currentAnimationState: "default",
            renderBaseWidth: this.width * 0.5,
            width: explosionAnimationsMetadata.width,
            height: explosionAnimationsMetadata.height,
          },
        });
      }
      recalculateMotionParameters() {
        this.frameInterval = Math.floor(Math.random() * 5 + 2.5);
        this.dx = Math.random() * 1.24 + (8 - this.frameInterval) * 0.5;
        this.dy = Math.random() * 1.24 + (8 - this.frameInterval) * 0.5;
      }
      resetPosition() {
        this.x =
          canvasConfig.render.width +
          canvasConfig.render.width * Math.floor(Math.random() * 5) +
          this.width * Math.floor(Math.random() * 5);
        this.y =
          canvasConfig.render.height * 0.25 +
          Math.random() * canvasConfig.render.height * 0.4;
        this.recalculateMotionParameters();
      }
      draw() {
        ctx2.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx2.fillRect(this.x, this.y, this.width, this.height);

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

        if (
          this.y < this.height * 0.1 ||
          this.y > canvasConfig.render.height * 0.9
        ) {
          this.dy = -this.dy;
        }

        const isOffStartScreen = this.x + this.width < 0;

        if (isOffStartScreen) {
          this.resetPosition();
          this.isHit = false;
          lives--;
        } else {
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

        if (this.isHit) {
          this.explosion.draw();
          this.explosion.update();

          if (this.explosion.sprite.currentFrameX >= 4) {
            this.explosion.sprite.currentFrameX = 0;
            this.isHit = false;
          }
        }
      }
    }

    const ravensMaxSize = 10;
    /** @type {Raven<"default">[]} */
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
        sfx: iceAttack2Sfx,
      });

      if (raven.y > canvasConfig.render.height * 0.5) {
        raven.dy = -1 * Math.random() * 2 - 0.5;
      } else {
        raven.dy = Math.random() * 2 - 0.5;
      }
      ravens[i] = raven;
    }

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );
      ctx2.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      drawScore();
      drawLives();
      for (const raven of ravens) {
        raven.update();
        raven.draw();
      }

      gameFrame++;
      if (lives <= 0) {
        drawGameOver();
      } else {
        animateId = requestAnimationFrame(animate);
      }
    }

    cleanUpManager.register(() => {
      if (!animateId) {
        return;
      }
      cancelAnimationFrame(animateId);
    });

    // Optionally show a warning
    if (isCanvasReadBlocked()) {
      alert(
        "⚠️ Your browser is blocking canvas pixel reads.\nPlease allow fingerprinting in Brave to play this game.",
      );
    } else {
      animate();
    }
  },
});

export default gameScreen;
