/**
 * @import { ScreenHandlerParams } from "#libs/types/core.js";
 * @import { SpriteMetaParam, SprintAnimationStatesParamItem } from "#libs/sprite.js";
 */

import { CleanUpManager } from "#libs/cleanup.js";
import { loadManyImageElement } from "#libs/dom.js";
import { scale2dSizeToFit } from "#libs/math.js";
import { roundToPrecision } from "#libs/number.js";
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
      class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
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

  const canvasSizes = {
    width: 600,
    height: 600,
  };

  const canvasDimensions = {
    inlineStart: 0,
    inlineEnd: canvasSizes.width,
    blockStart: 0,
    blockEnd: canvasSizes.height,
  };

  props.appElem.innerHTML = /* HTML */ `<section
    class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${props.handleGoPrevScreen
      ? `<button id="${goBackButtonId}">Go Back</button>`
      : ""}
    <small class="text-center"><em>In Progress</em></small>
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${canvasSizes.width}"
      height="${canvasSizes.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>

    <fieldset class="flex flex-wrap gap-4 justify-center items-center">
      <legend class="text-center font-medium">Choose Enemy Type</legend>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy1"
          class="accent-blue-500"
          checked
        />
        <span>Enemy 1</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy2"
          class="accent-blue-500"
        />
        <span>Enemy 2</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy3"
          class="accent-blue-500"
        />
        <span>Enemy 3</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy4"
          class="accent-blue-500"
        />
        <span>Enemy 4</span>
      </label>
    </fieldset>
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

  const enemyTypeRadios = /** @type {NodeListOf<HTMLInputElement>} */ (
    document.querySelectorAll("input[name='enemyType']")
  );

  if (!canvas) {
    throw new Error("Couldn't find the canvas!");
  }

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  let gameFrame = 0;
  const [enemyImg1, enemyImg2, enemyImg3, enemyImg4] = assets;

  /**
   * @template {string} TSpriteAnimationName
   *
   * @typedef {{
   * img: HTMLImageElement
   * width: number
   * height: number
   * spriteWidth: number
   * spriteHeight: number
   * x: number
   * y: number
   * currentFrameX: number;
   * }} BasicEnemy
   */

  /**
   * @template {string} TSpriteAnimationName
   * @template {Record<string, unknown>|undefined} [TMovePatternMeta=undefined]
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
     *  movePatternHandler: (enemy: Enemy<TSpriteAnimationName, TMovePatternMeta>) => void
     * 	onInitEnd?: (enemy: Enemy<TSpriteAnimationName, TMovePatternMeta>) => void
     *  createMovePatternMeta?: ((basicEnemy: BasicEnemy<TSpriteAnimationName>) => TMovePatternMeta)
     * }} options
     */
    constructor(options) {
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

      this.x = Math.random() * (canvasSizes.width - this.width); // To prevent initial overflow
      this.y = Math.random() * (canvasSizes.height - this.height); // To prevent initial overflow

      this.currentFrameX = 0;
      this.spriteAnimationStates = generateSpriteAnimationStates(
        options.spriteAnimationStates,
        options.spriteMeta,
      );

      this.currentAnimationState = options.currentAnimationState;
      this.speed = 0;
      this.speedModifier = 0;

      this.movePatternHandler = options.movePatternHandler;
      this.movePatternMeta =
        /** @type {ReturnType<NonNullable<typeof options['createMovePatternMeta']>>} */ (
          options.createMovePatternMeta?.({
            img: this.img,
            width: this.width,
            height: this.height,
            spriteWidth: this.spriteWidth,
            spriteHeight: this.spriteHeight,
            currentFrameX: this.currentFrameX,
            x: this.x,
            y: this.y,
          }) ?? {}
        );
      options.onInitEnd?.(this);
    }
    update() {
      this.movePatternHandler(this);

      // Animation sprite
      const animationState =
        this.spriteAnimationStates[this.currentAnimationState];

      if (gameFrame % this.speedModifier === 0) {
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

  const enemy1Frames = 6;
  const enemy2Frames = 6;
  const enemy3Frames = 6;
  const enemy4Frames = 9;

  /**
   *
   * @template {string} TSpriteAnimationName
   * @template {Record<string, unknown>|undefined} [TMovePatternMeta=undefined]
   *
   * @param {{
   * 	img: HTMLImageElement;
   * 	frames: number;
   * 	currentAnimationState: TSpriteAnimationName;
   *  spriteAnimationStates: SprintAnimationStatesParamItem<TSpriteAnimationName>[];
   *  spriteMeta?: SpriteMetaParam;
   *  createMovePatternMeta?: ((basicEnemy: BasicEnemy<TSpriteAnimationName>) => TMovePatternMeta)
   *  movePatternHandler: (enemy: Enemy<TSpriteAnimationName, TMovePatternMeta>) => void;
   *  onInitEnd?: (enemy: Enemy<TSpriteAnimationName, TMovePatternMeta>) => void;
   * }} options
   *
   */
  function createEnemyMeta(options) {
    const spriteMeta = options.spriteMeta ?? {
      width: roundToPrecision(options.img.naturalWidth / options.frames, 2),
      height: options.img.naturalHeight,
    };

    return {
      img: options.img,
      frames: options.frames,
      spriteAnimationStates: options.spriteAnimationStates,
      spriteMeta,
      currentAnimationState: options.currentAnimationState,
      createMovePatternMeta: options.createMovePatternMeta,
      movePatternHandler: options.movePatternHandler,
      onInitEnd: options.onInitEnd,
    };
  }

  const enemiesMeta = /** @type {const} */ ({
    enemy1: createEnemyMeta({
      img: enemyImg1,
      frames: enemy1Frames,
      spriteAnimationStates: [{ name: "default", frames: enemy1Frames }],
      currentAnimationState: /** @type {const} */ ("default"),
      createMovePatternMeta: () => ({}),
      movePatternHandler: (enemy) => {
        enemy.x += Math.random() * 5 - 2.5; // (random * rangeX) - offsetX
        enemy.y += Math.random() * 5 - 2.5; // (random * rangeY) - offsetY
      },
      onInitEnd: (enemy) => {
        enemy.speed = Math.random() * 4 + 1; // 1 to 5
        enemy.speedModifier = Math.floor(Math.random() * 3 + 1); // 1 to 4
      },
    }),
    enemy2: createEnemyMeta({
      img: enemyImg2,
      frames: enemy2Frames,
      spriteAnimationStates: [{ name: "default", frames: enemy2Frames }],
      currentAnimationState: /** @type {const} */ ("default"),
      createMovePatternMeta: () => ({
        angle: Math.random() * 0,
        angleSpeed: Math.random() * 0.2,
        curveY: Math.random() * 0.7 - 0.35,
        curveX: Math.random() * 0.7 - 0.35,
      }),
      movePatternHandler: (enemy) => {
        enemy.x -= enemy.speed;
        enemy.y +=
          enemy.movePatternMeta.curveY * Math.sin(enemy.movePatternMeta.angle);
        enemy.movePatternMeta.angle += enemy.movePatternMeta.angleSpeed;

        if (enemy.x + enemy.width < canvasDimensions.inlineStart) {
          enemy.x = canvasDimensions.inlineEnd;
          enemy.x = canvasSizes.width;
          enemy.y = Math.random() * canvasSizes.height;
        }
      },
      onInitEnd: (enemy) => {
        enemy.speed = Math.random() * 4 + 1; // 1 to 5
        enemy.speedModifier = Math.floor(Math.random() * 3 + 1); // 1 to 4
      },
    }),
    enemy3: createEnemyMeta({
      img: enemyImg3,
      frames: enemy3Frames,
      spriteAnimationStates: [{ name: "default", frames: enemy3Frames }],
      currentAnimationState: /** @type {const} */ ("default"),
      createMovePatternMeta: () => ({
        angle: Math.random() * 500,
        angleSpeed: Math.random() * 0.5 + 0.5,
        curveY: canvasSizes.width / 2,
        curveX: canvasSizes.height / 2,
      }),
      movePatternHandler: (enemy) => {
        enemy.x =
          enemy.movePatternMeta.curveX *
            Math.sin((enemy.movePatternMeta.angle * Math.PI) / 45) +
          (canvasSizes.width / 2 - enemy.width / 2);
        enemy.y =
          enemy.movePatternMeta.curveY *
            Math.cos((enemy.movePatternMeta.angle * Math.PI) / 135) +
          (canvasSizes.height / 2 - enemy.height / 2);
        enemy.movePatternMeta.angle += enemy.movePatternMeta.angleSpeed;

        if (enemy.x + enemy.width < canvasDimensions.inlineStart) {
          enemy.x = canvasDimensions.inlineEnd;
          enemy.x = canvasSizes.width;
          enemy.y = Math.random() * canvasSizes.height;
        }
      },
      onInitEnd: (enemy) => {
        enemy.speed = Math.random() * 4 + 1; // 1 to 5
        enemy.speedModifier = Math.floor(Math.random() * 3 + 1); // 1 to 4
      },
    }),
    enemy4: createEnemyMeta({
      img: enemyImg4,
      frames: enemy4Frames,
      spriteAnimationStates: [{ name: "default", frames: enemy4Frames }],
      currentAnimationState: /** @type {const} */ ("default"),
      createMovePatternMeta: (basicEnemy) => ({
        destinationX: Math.random() * (canvasSizes.height - basicEnemy.height),
        destinationY: Math.random() * (canvasSizes.width - basicEnemy.width),
        destinationFrameMoveInterval: Math.floor(Math.random() * 30 + 10),
      }),
      movePatternHandler: (enemy) => {
        if (
          gameFrame % enemy.movePatternMeta.destinationFrameMoveInterval ===
          0
        ) {
          enemy.movePatternMeta.destinationX =
            Math.random() * (canvasSizes.width - enemy.width);
          enemy.movePatternMeta.destinationY =
            Math.random() * (canvasSizes.height - enemy.height);
        }

        let dx = enemy.movePatternMeta.destinationX - enemy.x;
        let dy = enemy.movePatternMeta.destinationY - enemy.y;

        enemy.x += dx * 0.05;
        enemy.y += dy * 0.05;

        if (enemy.x + enemy.width < canvasDimensions.inlineStart) {
          enemy.x = canvasDimensions.inlineEnd;
          enemy.x = canvasSizes.width;
          enemy.y = Math.random() * canvasSizes.height;
        }
      },
      onInitEnd: (enemy) => {
        enemy.speed = Math.random() * 4 + 1; // 1 to 5
        enemy.speedModifier = Math.floor(Math.random() * 3 + 1); // 1 to 4

        enemy.movePatternMeta.destinationFrameMoveInterval = Math.floor(
          Math.random() * 30 + 10,
        ); // 10 to 40
        enemy.movePatternMeta.destinationX =
          Math.random() * (canvasSizes.width - enemy.width);
        enemy.movePatternMeta.destinationY =
          Math.random() * (canvasSizes.height - enemy.height);
      },
    }),
  });

  const enemiesSize = 20;
  const enemies = new Array(enemiesSize);
  /** @type {keyof typeof enemiesMeta} */
  let selectedEnemyMeta = "enemy2";
  /**
   *
   * @param {typeof enemiesMeta[keyof typeof enemiesMeta]} enemyMeta
   * @param {number} enemySize
   */
  function initEnemies(enemyMeta, enemySize) {
    for (let i = 0; i < enemySize; i++) {
      enemies[i] = new Enemy({
        .../** @type {typeof enemiesMeta['enemy1']} */ (
          /** @type {unknown} */ (enemyMeta)
        ),
        spriteScalingBaseWidth: 120,
      });
    }
  }
  initEnemies(enemiesMeta[selectedEnemyMeta], enemiesSize);

  enemyTypeRadios.forEach((radio) => {
    cleanUpManager.registerEventListener({
      elem: radio,
      type: "change",
      listener: (e) => {
        const selectedEnemyType = /** @type {HTMLInputElement} */ (e.target)
          .value;

        if (!(selectedEnemyType in enemiesMeta)) {
          throw new Error(`Enemy type "${selectedEnemyType}" not found!`);
        }

        const selectedEnemyMeta =
          enemiesMeta[
            /** @type {keyof typeof enemiesMeta} */ (selectedEnemyType)
          ];
        initEnemies(selectedEnemyMeta, enemiesSize);
      },
    });
  });

  /** @type {number|undefined} */
  let animateId;

  function animate() {
    ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);

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
