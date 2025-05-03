import initGameScreen from "#libs/core/dom.js";
import { GameLoop } from "#libs/create-game-loop.js";
import { adjustCanvas } from "#libs/dom/index.js";

const gameScreen = await initGameScreen({
  cb: async ({ appId, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const canvasConfig = {
      render: {
        width: 700,
        height: 500,
      },
      // The canvas bounding box is the bounding box of the canvas element
      // in the DOM. It is used to calculate the position of the canvas element
      // in the DOM and to adjust its size.
      dom: {
        width: 700,
        height: 500,
        top: 0,
        left: 0,
        right: 700,
        bottom: 500,
        x: 0,
        y: 0,
      },
    };

    await createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				style="max-width: ${canvasConfig.render.width}px; max-height: ${canvasConfig.render.height}px; width: 100%; height: 100%;"
				class="border border-solid border-gray-300 dark:border-gray-700 mx-auto max-w-full w-5xl bg-white"
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

    let groundPosY = canvasConfig.render.height - 10;
    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasConfig.dom = boundingBox;
        canvasConfig.render.width = boundingBox.width;
        canvasConfig.render.height = boundingBox.height;
        groundPosY = canvasConfig.render.height - 10;

        return { shouldUpdateCanvasSize: true };
      },
    });
    cleanupManager.register(adjustCanvasCleanup);

    const gravity = 9.8; // gravity acceleration in pixels per second squared
    class Ball {
      /**
       *
       * @param {number} x
       * @param {number} y
       * @param {number} radius
       * @param {number} vx
       * @param {number} vy
       * @param {string} color
       */
      constructor(x, y, radius, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.canUpdate = true;
      }

      update() {
        if (!this.canUpdate) {
          return;
        }
        const et = game.elapsedTimeS;
        this.vy += gravity; // gravity increases the vertical speed
        this.x += this.vx * et; // horizontal speed increases horizontal position
        this.y += this.vy * et; // vertical speed increases vertical position
        if (this.y > groundPosY - this.radius) {
          // if ball hits the ground
          this.y = groundPosY - this.radius; // reposition it at the ground
          this.vy *= -0.8; // then reverse and reduce its vertical speed
        }
        if (this.x > canvasConfig.render.width + this.radius) {
          // if ball goes beyond canvas
          this.x = -this.radius; // wrap it around
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
      }
    }

    const radius = 20;
    const color = "#0000ff";
    const x = 50; // initial horizontal position
    const y = 50; // initial vertical position
    const vx = 500; // initial horizontal speed
    const vy = 0; // initial vertical speed

    const ball = new Ball(x, y, radius, vx, vy, color);

    let oldState = {
      vx: ball.vx,
      vy: ball.vy,
    };
    cleanupManager.registerEventListener({
      elem: canvas,
      type: "mousedown",
      listener: (e) => {
        ball.canUpdate = false;

        ball.x = e.clientX - canvasConfig.dom.left;
        ball.y = e.clientY - canvasConfig.dom.top;
        oldState = {
          vx: ball.vx,
          vy: ball.vy,
        };
        ball.vx = 0;
        ball.vy = 0;
      },
    });
    cleanupManager.registerEventListener({
      elem: canvas,
      type: "mouseup",
      listener: () => {
        ball.canUpdate = true;
        ball.vx = oldState.vx;
        ball.vy = oldState.vy;
      },
    });
    cleanupManager.registerEventListener({
      elem: canvas,
      type: "mousemove",
      listener: (e) => {
        if (ball.canUpdate) {
          return;
        }

        ball.x = e.clientX - canvasConfig.dom.left;
        ball.y = e.clientY - canvasConfig.dom.top;
        ball.vx = 0;
        ball.vy = 0;
      },
    });
    cleanupManager.registerEventListener({
      elem: canvas,
      type: "mouseleave",
      listener: () => {
        if (ball.canUpdate) {
          return;
        }
        ball.canUpdate = true;
        ball.vx = oldState.vx;
        ball.vy = oldState.vy;
      },
    });

    const game = new GameLoop({
      fixedUpdate() {
        ball.update();
      },
      // Render with interpolation (alpha is fraction of leftover time, not needed here)
      render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(game.fps);

        ball.draw();

        // Draw the ground
        ctx.fillStyle = "green";
        ctx.fillRect(0, groundPosY, canvasConfig.render.width, 10);
      },

      name: "bounce-ball-demo",
    });

    game.start();

    cleanupManager.register(game.cleanup);
  },
});

export default gameScreen;
