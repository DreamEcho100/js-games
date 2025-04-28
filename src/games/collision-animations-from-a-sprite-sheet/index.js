/** @import { SpriteInfoInput, SpriteInfo } from "#libs/types/core.js"; */

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom/index.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { resolveBaseImportUrl } from "#libs/urls.js";

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
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
  cb: ({ appId, assets, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;
    const [explosionImage, ...sfxs] = assets;

    const explosionFramesSize = 5;
    const explosionImageDW = explosionImage.naturalWidth / explosionFramesSize;
    const explosionImageDH = explosionImage.naturalHeight;
    const explosionAnimationsStates = generateSpriteAnimationStates(
      [{ name: "default", frames: explosionFramesSize }],
      { width: explosionImageDW, height: explosionImageDH },
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

    createLayout(/* html */ `<canvas
			id="${canvasId}"
			width="${canvasConfig.render.width}"
			height="${canvasConfig.render.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 mx-auto max-w-full w-5xl"
		></canvas>`);

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
      },
    });
    cleanupManager.register(adjustCanvasCleanup);

    let gameFrame = 0;

    /** @template {string} TSpriteAnimationName */
    class Explosion {
      /**
       * @param {{
       * 	x: number,
       * 	y: number,
       *  sprite: SpriteInfoInput<TSpriteAnimationName>
       *  sfx: HTMLAudioElement;
       * }} props
       */
      constructor(props) {
        this.x = props.x;
        this.y = props.y;

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

        this.speedModifier = 8;
        this.angle = Math.random() * Math.PI * 2;
        this.sfx = props.sfx;
      }
      draw() {
        ctx.save();
        ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.5);
        ctx.rotate(this.angle);
        ctx.drawImage(
          this.sprite.img,
          this.sprite.width * this.sprite.currentFrameX,
          this.sprite.height * this.sprite.currentFrameY,
          this.sprite.width,
          this.sprite.height,
          0 - this.width * 0.5,
          0 - this.height * 0.5,
          this.width,
          this.height,
        );
        ctx.restore();
      }
      update() {
        const animationState =
          this.sprite.animationStates[this.sprite.currentAnimationState];

        if (this.sprite.currentFrameX === 0) {
          this.sfx.play();
        }

        if (gameFrame % this.speedModifier === 0) {
          this.sprite.currentFrameX =
            this.sprite.currentFrameX >= animationState.size - 1
              ? 0
              : this.sprite.currentFrameX + 1;
        }
      }
    }

    // /** @type {(Explosion<string>)[]} */
    // const explosions = new Set();
    /** @type {Set<Explosion<string>>} */
    const explosions = new Set();

    /** @param {MouseEvent} e */
    function handleAddExplosion(e) {
      const renderBaseWidth = 100;
      ctx.fillStyle = "white";
      const posX = e.pageX - canvasConfig.dom.x;
      const posY = e.pageY - canvasConfig.dom.y;

      const explosion = new Explosion({
        x: posX,
        y: posY,
        sprite: {
          animationStates: explosionAnimationsStates,
          currentAnimationState: "default",
          img: explosionImage,
          renderBaseWidth,
          width: explosionImageDW,
          height: explosionImageDH,
        },
        sfx: sfxs[Math.floor(Math.random() * sfxs.length)],
      });
      // explosions.push(explosion);
      explosions.add(explosion);
      explosion.x -= explosion.width * 0.5;
      explosion.y -= explosion.height * 0.5;
    }

    cleanupManager.registerEventListener({
      elem: canvas,
      type: "mousemove",
      listener: handleAddExplosion,
    });

    cleanupManager.registerEventListener({
      elem: canvas,
      type: "click",
      listener: handleAddExplosion,
    });

    /** @type {number|undefined} */
    let animateId;

    setTimeout(() => {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, canvasConfig.render.width, canvasConfig.render.height);
    }, 1000);

    let hexColorCounter = 0;

    function animate() {
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      hexColorCounter = (hexColorCounter + 1) % 360;
      ctx.fillStyle = `hsl(${hexColorCounter}, 100%, 50%)`;
      ctx.fillRect(0, 0, canvasConfig.render.width, canvasConfig.render.height);
      // for (let i = 0; i < explosions.length; i++) {
      //   const explosion = explosions[i];
      //   if (!explosion) {
      //     continue;
      //   }
      //   explosion.update();
      //   explosion.draw();
      //   // On The last frame, destroy
      //   if (
      //     explosion.sprite.currentFrameX >=
      //     explosion.sprite.animationStates[
      //       explosion.sprite.currentAnimationState
      //     ].size -
      //       1
      //   ) {
      //     explosions[i] = null;
      //   }
      // }

      explosions.forEach((explosion) => {
        if (!explosion) {
          return;
        }
        explosion.update();
        explosion.draw();
        // On The last frame, destroy
        if (
          explosion.sprite.currentFrameX >=
          explosion.sprite.animationStates[
            explosion.sprite.currentAnimationState
          ].size -
            1
        ) {
          explosions.delete(explosion);
        }
      });

      gameFrame++;
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

/*
🤯 Optional Cool Touch
💥 Particle Sparks on Explosion?
When triggering an explosion, you could also add:

js
Copy
Edit
for (let i = 0; i < 5; i++) {
  addSparkParticle({ x: posX, y: posY, direction: i * 45 + Math.random() * 30 });
}
With some tiny particles fading out — gives it a lot more juice.
*/
