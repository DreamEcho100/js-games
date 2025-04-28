import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom/index.js";

/**
 * @template {Record<string, any>} TItem
 * @typedef {{
 *	[P in TItem[keyof TItem]]: {
 *			[Key in keyof TItem]: TItem[Key] extends P ? Key : never
 *		}[keyof TItem]
 * }} ReverseRecord
 */

const gameScreen = await initGameScreen({
  cb: ({ appId, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const canvasConfig = {
      render: {
        width: 400,
        height: 400,
      },
      // The canvas bounding box is the bounding box of the canvas element
      // in the DOM. It is used to calculate the position of the canvas element
      // in the DOM and to adjust its size.
      dom: {
        width: 400,
        height: 400,
        top: 0,
        left: 0,
        right: 400,
        bottom: 400,
        x: 0,
        y: 0,
      },
    };

    createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
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

    let currentSecond = 0;
    let frameCount = 0;
    let frameLastSecond = 0;
    let lastFrameTime = 0;
    const tile = {
      w: 40,
      h: 40,
    };
    const map = {
      w: 10,
      h: 10,
    };

    class Character {
      /**
       * @param {{
       * 	registerEvents: (options: {
       *			keydownCb: (e: KeyboardEvent) => void;
       *			keyupCb: (e: KeyboardEvent) => void;
       *	}) => void
       * }} options
       */
      constructor(options) {
        /** The tile coordinates where the character is coming from */
        this.tileFrom = /** @type {[x: number, y: number]} */ ([1, 1]);
        /** The tile coordinates where the character is moving to */
        this.tileTo = /** @type {[x: number, y: number]} */ ([1, 1]);
        /** The exact pixel coordinates on the screen */
        this.position = /** @type {[x: number, y: number]} */ ([45, 45]);

        this.dimensions = /** @type {[w: number, h:number]} */ ([
          tile.w * 0.75,
          tile.h * 0.75,
        ]);

        /** When the movement started */
        this.timeMoved = 0;
        /** Movement takes time in ms */
        this.delayMove = 300;

        this.directionKeyMap = {
          up: "ArrowUp",
          right: "ArrowRight",
          down: "ArrowDown",
          left: "ArrowLeft",
        };
        /** @type {Character['directionKeyMap'][keyof Character['directionKeyMap']][]} */
        this.KeysCollection = Object.values(this.directionKeyMap);
        /**
         * @typedef {ReverseRecord<Character['directionKeyMap']>} ReversedDirectionKeyMap
         */
        this.keyDirectionMap =
          /**
           * @type {{
           * 	[Key in keyof ReversedDirectionKeyMap]: [ReversedDirectionKeyMap[Key], boolean]
           * }}
           */
          (
            Object.fromEntries(
              Object.entries(this.directionKeyMap).map((item) => [
                item[1],
                [item[0], false],
              ]),
            )
          );

        options.registerEvents({
          keydownCb: (e) => {
            if (e.key in this.keyDirectionMap) {
              this.keyDirectionMap[
                /** @type {keyof typeof this.keyDirectionMap} */ (e.key)
              ][1] = true;
            }
          },
          keyupCb: (e) => {
            if (e.key in this.keyDirectionMap) {
              this.keyDirectionMap[
                /** @type {keyof typeof this.keyDirectionMap} */ (e.key)
              ][1] = false;
            }
          },
        });
      }

      /**
       * @description
       * Setting both tileFrom and tileTo to the same coordinates
       * Converting tile coordinates to pixel coordinates
       * Centering the character in the tile (that's what the * 0.5 part does)
       *
       * @param {number} x
       * @param {number} y
       */
      placeAt(x, y) {
        // We change the tile position to the new tile position
        this.tileFrom = /** @type {[number, number]} */ ([x, y]);
        // We set the tile to the new tile position
        this.tileTo = /** @type {[number, number]} */ ([x, y]);
        // Then `position` is set to the new tile position
        this.position = /** @type {[number, number]} */ ([
          // `x` is multiplied by the tile width + the padding _(half the difference between the tile width and the character width)_
          x * tile.w + (tile.w - this.dimensions[0]) * 0.5,
          // `y` is multiplied by the tile height + the padding _(half the difference between the tile height and the character height)_
          y * tile.h + (tile.h - this.dimensions[1]) * 0.5,
        ]);
      }

      /**
       * @description
       * Checks if the character is already at its destination
       * Calculates how much time has passed since movement began
       * If the movement time is complete, snaps the character to the destination
       * If still moving, calculates a position between start and end based on elapsed time
       * Returns true while moving, false when not moving
       *
       * The formula for the intermediate position is:
       *
       * Start position + (progress × distance)
       * Where progress is a value from 0.0 to 1.0 representing completion
       *
       * @param {number} currentFrameTime
       * @returns {boolean}
       */
      processMovement(currentFrameTime) {
        // Not moving if start and end positions are the same
        if (
          this.tileFrom[0] === this.tileTo[0] &&
          this.tileFrom[1] === this.tileTo[1]
        ) {
          return false;
        }

        // Calculate elapsed time since movement started
        const elapsed = currentFrameTime - this.timeMoved;

        if (elapsed >= this.delayMove) {
          // Movement finished - snap to destination
          this.placeAt(this.tileTo[0], this.tileTo[1]);
        } else {
          // Calculate movement progress (0.0 to 1.0)
          const progress = elapsed / this.delayMove;

          // Update x position based on progress
          if (this.tileTo[0] !== this.tileFrom[0]) {
            const tileDistance = this.tileTo[0] - this.tileFrom[0];
            const moveDistance = tileDistance * progress;

            this.position[0] =
              (this.tileFrom[0] + moveDistance) * tile.w +
              (tile.w - this.dimensions[0]) * 0.5;
          }

          // Update y position based on progress
          if (this.tileTo[1] !== this.tileFrom[1]) {
            const tileDistance = this.tileTo[1] - this.tileFrom[1];
            const moveDistance = tileDistance * progress;

            this.position[1] =
              (this.tileFrom[1] + moveDistance) * tile.h +
              (tile.h - this.dimensions[1]) * 0.5;
          }
        }

        return true; // Still moving
      }

      /**
       * @param {number} x
       * @param {number} y
       * @returns {number}
       */
      toMapIndex(x, y) {
        return y * map.w + x;
      }

      /**
       * @param {number} currentFrameTime
       */
      update(currentFrameTime) {
        // Process ongoing movement first
        const isMoving = this.processMovement(currentFrameTime);

        // Only check for new movement if not already moving
        if (!isMoving) {
          // Check each direction key
          for (const key of this.KeysCollection) {
            const [direction, isPressed] = this.keyDirectionMap[key];

            // Skip keys that aren't pressed
            if (!isPressed) continue;

            // Try to move in the pressed direction
            let hadMoved = false;

            // Direction-specific movement logic
            switch (direction) {
              // Can move up if: not at top row, destination is a path
              case "up":
                if (
                  this.tileFrom[1] > 0 &&
                  gameMap[
                    this.toMapIndex(this.tileFrom[0], this.tileFrom[1] - 1)
                  ] == 1
                ) {
                  this.tileTo[1] -= 1;
                  hadMoved = true;
                }
                break;
              // Similar logic for other directions...
              case "down":
                if (
                  this.tileFrom[1] < map.h - 1 &&
                  gameMap[
                    this.toMapIndex(this.tileFrom[0], this.tileFrom[1] + 1)
                  ] == 1
                ) {
                  this.tileTo[1] += 1;
                  hadMoved = true;
                }
                break;
              case "left":
                if (
                  this.tileFrom[0] > 0 &&
                  gameMap[
                    this.toMapIndex(this.tileFrom[0] - 1, this.tileFrom[1])
                  ] == 1
                ) {
                  this.tileTo[0] -= 1;
                  hadMoved = true;
                }
                break;
              case "right":
                if (
                  this.tileFrom[0] < map.w - 1 &&
                  gameMap[
                    this.toMapIndex(this.tileFrom[0] + 1, this.tileFrom[1])
                  ] == 1
                ) {
                  this.tileTo[0] += 1;
                  hadMoved = true;
                }
                break;
            }

            if (hadMoved) {
              // Record when movement started
              this.timeMoved = currentFrameTime;
              break; // Process only one movement direction
            }
          }
        }
      }

      draw() {
        ctx.fillStyle = "#0000ff";
        ctx.fillRect(
          this.position[0],
          this.position[1],
          this.dimensions[0],
          this.dimensions[1],
        );
      }
    }

    const character = new Character({
      registerEvents: (options) => {
        cleanupManager.registerWindowEventListener({
          type: "keyup",
          listener: options.keyupCb,
        });
        cleanupManager.registerWindowEventListener({
          type: "keydown",
          listener: options.keydownCb,
        });
      },
    });

    // prettier-ignore
    const gameMap = [
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
			0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
			0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
			0, 1, 0, 1, 0, 0, 1, 1, 1, 0,
			0, 1, 0, 1, 0, 1, 0, 0, 1, 0,
			0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
			0, 1, 0, 0, 0, 0, 1, 1, 0, 0,
			0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		];

    ctx.font = "bold 10pt sans-serif";

    /** @type {number|undefined} */
    let animateId;
    function animate() {
      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      const currentFrameTime = Date.now();
      const timeElapsed = currentFrameTime - lastFrameTime;

      const sec = Math.floor(Date.now() * 0.001);
      if (sec !== currentSecond) {
        currentSecond = sec;
        frameLastSecond = frameCount;
        frameCount = 1;
      } else {
        frameCount++;
      }

      /**
       * Map drawing code
       *
       * 0 represents walls (drawn as gray)
       *	1 represents paths (drawn as white)
       *	The character can only move on path tiles (value 1)
       */
      for (let y = 0; y < map.h; y++) {
        for (let x = 0; x < map.w; x++) {
          // Draw tiles...
          switch (gameMap[y * map.w + x]) {
            case 0:
              ctx.fillStyle = "#999999";
              break;
            default:
              ctx.fillStyle = "#eeeeee";
              break;
          }
          ctx.fillRect(x * tile.w, y * tile.h, tile.w, tile.h);
        }
      }

      character.update(currentFrameTime);
      character.draw();

      // FPS counter
      ctx.fillStyle = "#ff0000";
      ctx.fillText(`FPS: ${frameLastSecond}`, 10, 20);

      lastFrameTime = currentFrameTime;
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
