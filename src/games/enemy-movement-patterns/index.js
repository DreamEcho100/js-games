/**
 * @import { ScreenHandlerParams } from "#libs/types/core.js";
 * @import { SpriteMetaParam, SprintAnimationStatesParamItem } from "#libs/sprite.js";
 */

import { CleanUpManager } from "#libs/cleanup.js";
import { adjustCanvasDimensions, loadManyImageElement } from "#libs/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";

/** @param {ScreenHandlerParams} props */
export default async function vanillaJavascriptSpriteAnimationTechniques(
  props,
) {
  const appId = `app-${Math.random().toString(32)}`;
  const goBackButtonId = `go-back-${appId}`;

  function goBack() {
    props.handleGoPrevScreen?.();
    cleanUpManager.cleanUp();
  }

  const cleanUpManager = new CleanUpManager();

  props.appElem.innerHTML = `
	<section class="flex justify-center items-center p-12 text-lg">
		Loading assets...
	</section>
`;

  const [assetsError, assets] = await loadManyImageElement(
    /** @type {const} */ ([
      import.meta.resolve("./enemies/enemy1.png", new URL(import.meta.url)),
      import.meta.resolve("./enemies/enemy2.png", new URL(import.meta.url)),
      import.meta.resolve("./enemies/enemy3.png", new URL(import.meta.url)),
      import.meta.resolve("./enemies/enemy4.png", new URL(import.meta.url)),
    ]),
  );

  if (assetsError) {
    console.error(assetsError);
    props.appElem.innerHTML = /* HTML */ `<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
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

  const canvasConfig = { width: 600, height: 600 };

  props.appElem.innerHTML = /* HTML */ `<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${props.handleGoPrevScreen
      ? `<button id="${goBackButtonId}">Go Back</button>`
      : ""}
    <small><em>In Progress</em></small>
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${canvasConfig.width}"
      height="${canvasConfig.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
  </section>`;

  cleanUpManager.registerEventListener({
    elem: document.getElementById(goBackButtonId),
    type: "click",
    listener: goBack,
    silent: process.env.NODE_ENV !== "production",
  });

  const canvas = /** @type {HTMLCanvasElement|null} */ (
    document.getElementById("vanillaJavascriptSpriteAnimationTechniques")
  );

  if (!canvas) {
    throw new Error("Couldn't find the canvas!");
  }

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  const [CANVAS_WIDTH, CANVAS_HEIGHT] = adjustCanvasDimensions(
    canvas,
    ctx,
    canvasConfig.width,
    canvasConfig.height,
  );
  let gameFrame = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enemyImg1, enemyImg2, enemyImg3, enemyImg4] = assets;

  /**
   * @template {string} TSpriteAnimationName
   */
  class Enemy {
    /**
     *
     * @param {{
     * 	img: HTMLImageElement;
     * 	spriteAnimationStates: SprintAnimationStatesParamItem<TSpriteAnimationName>[];
     * 	spriteMeta: SpriteMetaParam
     * 	currentAnimationState: TSpriteAnimationName;
     * 	spriteScalingBaseWidth: number;
     * }} options
     */
    constructor(
      options,
      // img, spriteAnimationStates, spriteMeta
    ) {
      this.x = Math.random() * CANVAS_WIDTH;
      this.y = Math.random() * CANVAS_HEIGHT;
      this.img = options.img;
      const dimensions = scale2dSizeToFit({
        containerWidth: options.spriteScalingBaseWidth,
        sourceWidth: options.spriteMeta.width,
        sourceHeight: options.spriteMeta.height,
      });
      this.width = dimensions.width;
      this.height = dimensions.height;
      this.spriteWidth = options.spriteMeta.width;
      this.spriteHeight = options.spriteMeta.height;
      // this.width = this.spriteWidth * 0.4;
      // this.height = this.spriteHeight * 0.4;
      this.currentFrameX = 0;
      this.spriteAnimationStates = generateSpriteAnimationStates(
        options.spriteAnimationStates,
        options.spriteMeta,
      );
      this.currentAnimationState = options.currentAnimationState;
      this.speed = Math.random() * 4 - 2; // -2 to 2
      this.speedModifier = Math.floor(Math.random() * 3 + 1); // 1 to 4
    }
    update() {
      this.x += this.speed;
      this.y += this.speed;

      // Animation sprite
      const animationState =
        this.spriteAnimationStates[this.currentAnimationState];

      if (gameFrame % this.speedModifier == 0) {
        this.currentFrameX =
          this.currentFrameX >= animationState.locations.length - 1
            ? 0
            : this.currentFrameX + 1;
      }
    }
    draw() {
      ctx.drawImage(
        this.img,
        this.spriteWidth * this.currentFrameX,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height,
      );
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  const enemiesSize = 20;
  const enemies = new Array(enemiesSize);
  for (let i = 0; i < enemiesSize; i++) {
    enemies[i] = new Enemy({
      img: enemyImg1,
      spriteAnimationStates: /** @type {const} */ ([
        { name: "default", frames: 6 },
      ]),
      spriteMeta: {
        width: enemyImg1.naturalWidth / 6,
        height: enemyImg1.naturalHeight,
      },
      currentAnimationState: "default",
      spriteScalingBaseWidth: 120,
    });
  }

  /** @type {number|undefined} */
  let animateId;

  function animate() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const enemy of enemies) {
      enemy.update();
      enemy.draw();
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
}
