/**
 * @import { TSprintAnimationState } from "#libs/types/core.js";
 */

import initGameScreen from "#libs/core/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
    {
      type: "image",
      src: import.meta.resolve("./boom.png", new URL(import.meta.url)),
    },
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

    const canvasSizes = { width: 500, height: 700 };
    const canvasBoundingBox = {
      width: canvasSizes.width,
      height: canvasSizes.height,
      top: 0,
      left: 0,
      right: canvasSizes.width,
      bottom: canvasSizes.height,
      x: 0,
      y: 0,
    };

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

    const initialCanvasBoundingBox = canvas.getBoundingClientRect();
    canvasBoundingBox.width = initialCanvasBoundingBox.width;
    canvasBoundingBox.height = initialCanvasBoundingBox.height;
    canvasBoundingBox.top = initialCanvasBoundingBox.top;
    canvasBoundingBox.left = initialCanvasBoundingBox.left;
    canvasBoundingBox.right = initialCanvasBoundingBox.right;
    canvasBoundingBox.bottom = initialCanvasBoundingBox.bottom;
    canvasBoundingBox.x = initialCanvasBoundingBox.x;
    canvasBoundingBox.y = initialCanvasBoundingBox.y;
    canvas.width = canvasBoundingBox.width;
    canvas.height = canvasBoundingBox.height;

    /** @type {NodeJS.Timeout|undefined} */
    let resizeObserverTimeoutId;
    const canvasResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== canvas) {
          continue;
        }

        if (resizeObserverTimeoutId) {
          clearTimeout(resizeObserverTimeoutId);
        }

        resizeObserverTimeoutId = setTimeout(() => {
          console.log("reflow");
          const initialCanvasBoundingBox = canvas.getBoundingClientRect();
          canvasBoundingBox.width = initialCanvasBoundingBox.width;
          canvasBoundingBox.height = initialCanvasBoundingBox.height;
          canvasBoundingBox.top = initialCanvasBoundingBox.top;
          canvasBoundingBox.left = initialCanvasBoundingBox.left;
          canvasBoundingBox.right = initialCanvasBoundingBox.right;
          canvasBoundingBox.bottom = initialCanvasBoundingBox.bottom;
          canvasBoundingBox.x = initialCanvasBoundingBox.x;
          canvasBoundingBox.y = initialCanvasBoundingBox.y;

          canvas.width = canvasBoundingBox.width;
          canvas.height = canvasBoundingBox.height;
        }, 1000);
      }
    });

    const canvasBoxSizing = /** @type {"border-box"|"content-box"} */ (
      /** @type {{ value?: CanvasRenderingContext2D }} */ (
        canvas.computedStyleMap().get("box-sizing")
      )?.value ??
        getComputedStyle(canvas).boxSizing ??
        canvas.style.boxSizing
    );
    // canvasResizeObserver.observe(canvas, {
    //   box: canvasBoxSizing,
    // });
    // cleanUpManager.register(() => canvasResizeObserver.disconnect());

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );

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
       * 		animationStates: TSprintAnimationState<TSpriteAnimationName>;
       * 	currentAnimationState: TSpriteAnimationName;
       *    img: HTMLImageElement
       *    renderBaseWidth: number
       *    width: number
       *    height: number
       * 	}
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
      }
      draw() {
        ctx.drawImage(
          this.sprite.img,
          this.sprite.width * this.sprite.currentFrameX,
          this.sprite.height * this.sprite.currentFrameY,
          this.sprite.width,
          this.sprite.height,
          this.x,
          this.y,
          this.width,
          this.height,
        );
      }
      update() {
        const animationState =
          this.sprite.animationStates[this.sprite.currentAnimationState];

        if (gameFrame % this.speedModifier === 0) {
          this.sprite.currentFrameX =
            this.sprite.currentFrameX >= animationState.locations.length - 1
              ? 0
              : this.sprite.currentFrameX + 1;
        }
      }
    }

    /** @type {Explosion<string>[]} */
    const explosions = [];

    console.log("___ canvasBoundingBox", canvasBoundingBox);

    cleanUpManager.registerEventListener({
      elem: /** @type {HTMLBodyElement} */ (document.body),
      type: "click",
      listener: (e) => {
        console.log(
          e.y,
          e.x,
          e.x - canvasBoundingBox.x,
          e.y - canvasBoundingBox.y,
        );
        const renderBaseWidth = 100;
        ctx.fillStyle = "white";
        const posX = e.x - canvasBoundingBox.x;
        const posY = e.y - canvasBoundingBox.y;
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
        });
        explosions.push(explosion);
        explosion.x -= explosion.width * 0.5;
        explosion.y -= explosion.height * 0.5;
        // ctx.fillRect(posX, posY, width, height);
      },
    });

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);

      for (const explosion of explosions) {
        explosion.update();
        explosion.draw();
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

    animate();
  },
});

export default gameScreen;
