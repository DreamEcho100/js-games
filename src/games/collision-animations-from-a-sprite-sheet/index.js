/**
 * @import { TSprintAnimationState } from "#libs/types/core.js";
 */

import initGameScreen from "#libs/core/dom.js";
import { roundToPrecision, scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";

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
function adjustCanvas({ canvas, ctx, onUpdateCanvasSize, debounce = 100 }) {
  const initialCanvasBoundingBox = canvas.getBoundingClientRect();

  const canvasBoundingBox = {
    width: roundToPrecision(initialCanvasBoundingBox.width, 2),
    height: roundToPrecision(initialCanvasBoundingBox.height, 2),
    top: roundToPrecision(initialCanvasBoundingBox.top, 2),
    left: roundToPrecision(initialCanvasBoundingBox.left, 2),
    right: roundToPrecision(initialCanvasBoundingBox.right, 2),
    bottom: roundToPrecision(initialCanvasBoundingBox.bottom, 2),
    x: roundToPrecision(initialCanvasBoundingBox.x, 2),
    y: roundToPrecision(initialCanvasBoundingBox.y, 2),
  };

  const updateCanvasSize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = roundToPrecision(rect.width * dpr, 2);
    canvas.height = roundToPrecision(rect.height * dpr, 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);

    const boundingBox = canvas.getBoundingClientRect();
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

  canvas.style.width = `${roundToPrecision(
    initialCanvasBoundingBox.width / 16,
    2,
  )}rem`;
  // `${initialCanvasBoundingBox.width}px`;
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

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
    {
      type: "image",
      src: import.meta.resolve(
        "./assets/images/boom.png",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: import.meta.resolve(
        "./assets/audios/Magic SFX Preview Pack/Fire impact 1.wav",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: import.meta.resolve(
        "./assets/audios/Magic SFX Preview Pack/Healing Full.wav",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: import.meta.resolve(
        "./assets/audios/Magic SFX Preview Pack/Ice attack 2.wav",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: import.meta.resolve(
        "./assets/audios/Magic SFX Preview Pack/Misc 02.wav",
        new URL(import.meta.url),
      ),
    },
    {
      type: "audio",
      src: import.meta.resolve(
        "./assets/audios/Magic SFX Preview Pack/Wind effects 5.wav",
        new URL(import.meta.url),
      ),
    },
  ]),
  cb: ({ assets, cleanUpManager, createLayout }) => {
    const [explosionImage, ...sfxs] = assets;
    const explosionImageSourceWidth = explosionImage.naturalWidth;
    const explosionImageSourceHeight = explosionImage.naturalHeight;
    const explosionFramesSize = 5;
    const explosionImageDW = explosionImageSourceWidth / explosionFramesSize;
    const explosionImageDH = explosionImageSourceHeight;
    const explosionAnimationsStates = generateSpriteAnimationStates(
      [{ name: "default", frames: 5 }],
      { width: explosionImageDW, height: explosionImageDH },
    );

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

    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasBoundingBox = boundingBox;
      },
    });
    cleanUpManager.register(adjustCanvasCleanup);

    let gameFrame = 0;

    /**
     * @template {string} TSpriteAnimationName
     */
    class Explosion {
      /**
       * @param {{
       * 	x: number,
       * 	y: number,
       *  sprite: {
       *   animationStates: TSprintAnimationState<TSpriteAnimationName>;
       *   currentAnimationState: TSpriteAnimationName;
       *   img: HTMLImageElement;
       *   renderBaseWidth: number;
       *   width: number;
       *   height: number;
       * 	}
       *  sfx: HTMLAudioElement;
       * }} props
       */
      constructor(props) {
        this.x = props.x;
        this.y = props.y;

        const dimensions = scale2dSizeToFit({
          containerWidth: props.sprite.renderBaseWidth,
          sourceWidth: props.sprite.width,
          sourceHeight: props.sprite.height,
        });
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
            this.sprite.currentFrameX >= animationState.locations.length - 1
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
      const posX = e.pageX - canvasBoundingBox.x;
      const posY = e.pageY - canvasBoundingBox.y;
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

    cleanUpManager.registerEventListener({
      elem: canvas,
      type: "mousemove",
      listener: handleAddExplosion,
    });

    cleanUpManager.registerEventListener({
      elem: canvas,
      type: "click",
      listener: handleAddExplosion,
    });

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(0, 0, canvasBoundingBox.width, canvasBoundingBox.height);

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
      //     ].locations.length -
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
          ].locations.length -
            1
        ) {
          explosions.delete(explosion);
        }
      });

      gameFrame++;
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
