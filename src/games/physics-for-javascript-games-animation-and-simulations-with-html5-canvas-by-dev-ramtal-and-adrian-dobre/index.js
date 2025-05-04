/* eslint-disable @typescript-eslint/no-unused-vars */
import initGameScreen from "#libs/core/dom.js";
import { GameLoop } from "#libs/create-game-loop.js";
import { adjustCanvas, CanvasConfig } from "#libs/dom/index.js";

const gravityBallDemo = await initGameScreen({
  cb: async ({ appId, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const canvasConfig = new CanvasConfig({
      size: { width: 700, height: 500 },
      maxSize: { width: 1024 },
    });

    await createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 bg-white mx-auto w-full"
				style="max-width: ${canvasConfig.initial.renderMaxSize?.width}px;"
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
        canvasConfig.updateDomConfig(boundingBox).adjustRenderScale({
          ctx,
          ctxActions: ["scaleBasedImageSmoothing", "setScale"],
          canvas,
          canvasActions: ["setSize", "setStyleWidth"],
        });

        groundPosY = canvasConfig.render.height - 10;
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

/**
 * Graph represents a 2D Cartesian coordinate system rendered on a canvas.
 * It maps real math coordinates (like x: -5 to 5) into screen pixels.
 *
 *   Canvas Coordinate System (top-left is 0,0):
 *
 *     (0,0) ----> x
 *       |
 *       |
 *       v
 *       y
 *
 *   Math Coordinate System:
 *
 *       y ↑
 *         |
 *         |____→ x
 *
 * This class converts math coordinates into canvas pixels to draw a proper grid and axes.
 */
class GraphV3 {
  /**
   * Create a new Graph.
   *
   * @param {number} xmin - Minimum x value (left edge of graph)
   * @param {number} xmax - Maximum x value (right edge of graph)
   * @param {number} ymin - Minimum y value (bottom edge of graph)
   * @param {number} ymax - Maximum y value (top edge of graph)
   * @param {number} originX - x position of origin in pixels
   * @param {number} originY - y position of origin in pixels
   * @param {number} width - Width of graph in pixels
   * @param {number} height - Height of graph in pixels
   */
  constructor(xmin, xmax, ymin, ymax, originX, originY, width, height) {
    // Math coordinate bounds
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;

    // Canvas settings
    this.originX = originX;
    this.originY = originY;
    this.width = width;
    this.height = height;

    // Size of tick label boxes (for spacing)
    this.labelWidth = 15;
    this.labelHeight = 20;

    // Scaling factors: how many math units per pixel
    this.scaleX = (xmax - xmin) / width;
    this.scaleY = (ymax - ymin) / height;

    // Precalculate pixel boundaries for drawing
    this.pixelXMin = originX + xmin / this.scaleX;
    this.pixelXMax = originX + xmax / this.scaleX;
    this.pixelYMin = originY - ymin / this.scaleY;
    this.pixelYMax = originY - ymax / this.scaleY;

    // Axis label anchor positions
    this.textX = originX - this.labelWidth;
    this.textY = originY;
  }

  /**
   * Draws a full grid on the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} xMajor - Major x-axis spacing (math units)
   * @param {number} xMinor - Minor x-axis spacing (math units)
   * @param {number} yMajor - Major y-axis spacing (math units)
   * @param {number} yMinor - Minor y-axis spacing (math units)
   */
  drawGrid(ctx, xMajor, xMinor, yMajor, yMinor) {
    const majorXStep = xMajor / this.scaleX;
    const minorXStep = xMinor / this.scaleX;
    const majorYStep = yMajor / this.scaleY;
    const minorYStep = yMinor / this.scaleY;

    // ─── Major Grid ─────────────────────────
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let y = this.pixelYMax; y <= this.pixelYMin; y += majorYStep) {
      ctx.moveTo(this.pixelXMin, y);
      ctx.lineTo(this.pixelXMax, y);
    }

    for (let x = this.pixelXMin; x <= this.pixelXMax; x += majorXStep) {
      ctx.moveTo(x, this.pixelYMin);
      ctx.lineTo(x, this.pixelYMax);
    }

    ctx.stroke();

    // ─── Minor Grid ─────────────────────────
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let y = this.pixelYMax; y <= this.pixelYMin; y += minorYStep) {
      ctx.moveTo(this.pixelXMin, y);
      ctx.lineTo(this.pixelXMax, y);
    }

    for (let x = this.pixelXMin; x <= this.pixelXMax; x += minorXStep) {
      ctx.moveTo(x, this.pixelYMin);
      ctx.lineTo(x, this.pixelYMax);
    }

    ctx.stroke();

    // ─── Axis Labels ────────────────────────
    ctx.font = "10pt Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";

    for (let y = this.pixelYMax; y <= this.pixelYMin; y += majorYStep) {
      const value = ((this.originY - y) * this.scaleY).toFixed(2);
      ctx.fillText(value, this.textX, y - this.labelHeight / 2);
    }

    ctx.textAlign = "left";

    for (let x = this.pixelXMin; x <= this.pixelXMax; x += majorXStep) {
      const value = ((x - this.originX) * this.scaleX).toFixed(2);
      ctx.fillText(value, x + 4, this.textY + 5);
    }
  }

  /**
   * Draws the x and y axes with optional labels.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} xlabel
   * @param {string} ylabel
   */
  drawAxes(ctx, xlabel = "x", ylabel = "y") {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();

    // X-axis
    ctx.moveTo(this.pixelXMin, this.originY);
    ctx.lineTo(this.pixelXMax, this.originY);

    // Y-axis
    ctx.moveTo(this.originX, this.pixelYMin);
    ctx.lineTo(this.originX, this.pixelYMax);

    ctx.stroke();

    // Axis labels
    ctx.font = "12pt Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(
      xlabel,
      this.pixelXMax + this.labelWidth * 0.75,
      this.textY - this.labelHeight / 2,
    );
    ctx.fillText(
      ylabel,
      this.textX + this.labelWidth / 2 + 5,
      this.pixelYMax - 1.5 * this.labelHeight,
    );
  }

  /**
   * Plots a series of (x, y) points.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number[]} xArr
   * @param {number[]} yArr
   * @param {string} color
   * @param {boolean} drawDots
   * @param {boolean} drawLines
   */
  plot(ctx, xArr, yArr, color = "#00f", drawDots = true, drawLines = true) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < xArr.length; i++) {
      const px = this.originX + xArr[i] / this.scaleX;
      const py = this.originY - yArr[i] / this.scaleY;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else if (drawLines) {
        ctx.lineTo(px, py);
      } else {
        ctx.moveTo(px, py);
      }

      if (drawDots) {
        ctx.moveTo(px + 1, py);
        ctx.arc(px, py, 1, 0, 2 * Math.PI);
      }
    }

    ctx.stroke();
  }
}

/**
 * ┌────────────────────────────────────────┐
 * │              CANVAS                   │
 * │      (Pixels, not math units)         │
 * │                                        │
 * │    ↑ y ↑                               │
 * │    │                                   │
 * │    │                     (xmax, ymax)  │
 * │    │                         ┌───┐     │
 * │    │                         │   │     │
 * │    │     (x0,y0) ●───────────┘   │     │
 * │    │                             ← x → │
 * │   (xmin, ymin)                 (right) │
 * └────────────────────────────────────────┘
 *
 * Maps math coordinates → canvas pixels and draws axes, grid, and plots.
 */
class GraphV2 {
  /**
   * @param {object} config
   * @param {number} config.xmin - Math min X
   * @param {number} config.xmax - Math max X
   * @param {number} config.ymin - Math min Y
   * @param {number} config.ymax - Math max Y
   * @param {number} config.originX - Canvas X origin
   * @param {number} config.originY - Canvas Y origin
   * @param {number} config.pixelWidth - Canvas width
   * @param {number} config.pixelHeight - Canvas height
   */
  constructor({
    xmin,
    xmax,
    ymin,
    ymax,
    originX,
    originY,
    pixelWidth,
    pixelHeight,
  }) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
    this.originX = originX;
    this.originY = originY;
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;

    this.xUnitsPerPixel = (xmax - xmin) / pixelWidth;
    this.yUnitsPerPixel = (ymax - ymin) / pixelHeight;
  }

  mathXToCanvas(x) {
    return this.originX + x / this.xUnitsPerPixel;
  }

  mathYToCanvas(y) {
    return this.originY - y / this.yUnitsPerPixel;
  }

  /**
   * Draws grid and optional axis tick numbers.
   */
  drawGrid(ctx, xMajor = 1, xMinor = 0.5, yMajor = 1, yMinor = 0.5) {
    const drawLines = (spacing, vertical, color) => {
      const step =
        spacing / (vertical ? this.xUnitsPerPixel : this.yUnitsPerPixel);
      ctx.strokeStyle = color;
      ctx.beginPath();

      if (vertical) {
        for (
          let x = this.originX + this.xmin / this.xUnitsPerPixel;
          x <= this.pixelWidth;
          x += step
        ) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.pixelHeight);
        }
      } else {
        for (
          let y = this.originY - this.ymin / this.yUnitsPerPixel;
          y >= 0;
          y -= step
        ) {
          ctx.moveTo(0, y);
          ctx.lineTo(this.pixelWidth, y);
        }
      }

      ctx.stroke();
    };

    drawLines(xMinor, true, "#eee");
    drawLines(yMinor, false, "#eee");
    drawLines(xMajor, true, "#aaa");
    drawLines(yMajor, false, "#aaa");
  }

  /**
   * Draws x and y axes, and numbers along them.
   */
  drawAxes(ctx, xLabel = "x", yLabel = "y", labelSpacing = 1) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    // Axes
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.pixelWidth, this.originY);
    ctx.moveTo(this.originX, 0);
    ctx.lineTo(this.originX, this.pixelHeight);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // X-axis labels
    for (let x = this.xmin; x <= this.xmax; x += labelSpacing) {
      const px = this.mathXToCanvas(x);
      if (px >= 0 && px <= this.pixelWidth)
        ctx.fillText(x.toString(), px, this.originY + 4);
    }

    // Y-axis labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = this.ymin; y <= this.ymax; y += labelSpacing) {
      const py = this.mathYToCanvas(y);
      if (py >= 0 && py <= this.pixelHeight)
        ctx.fillText(y.toString(), this.originX - 4, py);
    }

    // Axis names
    ctx.fillText(xLabel, this.pixelWidth - 10, this.originY + 4);
    ctx.fillText(yLabel, this.originX + 10, 10);
  }

  /**
   * Plots (x, y) points with optional dots and connecting lines.
   */
  plot(ctx, xPoints, yPoints, color = "#00f", dots = true, lines = true) {
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.beginPath();

    for (let i = 0; i < xPoints.length; i++) {
      const x = this.mathXToCanvas(xPoints[i]);
      const y = this.mathYToCanvas(yPoints[i]);

      if (lines) {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (dots) {
        ctx.moveTo(x + 1, y); // reset path
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      }
    }

    ctx.stroke();
  }
}

class Graph {
  /**
   * The graph is a rectangle with the following properties:
   *
   * @param {number} xmin - minimum x value, left bound
   * @param {number} xmax - maximum x value, right bound
   * @param {number} ymin - minimum y value, bottom bound
   * @param {number} ymax - maximum y value, top bound
   * @param {number} x0 - x value of the origin
   * @param {number} y0 - y value of the origin
   * @param {number} xwidth - width of the graph in pixels
   * @param {number} ywidth - height of the graph in pixels
   */
  constructor(xmin, xmax, ymin, ymax, x0, y0, xwidth, ywidth) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
    this.x0 = x0;
    this.y0 = y0;
    this.xwidth = xwidth;
    this.ywidth = ywidth;

    // width and height of textbox used for displaying values on the axes	// this should not have to be tampered with (I hope)
    this.tw = 15;
    this.th = 20;

    // assign parameter values based on specified arguments
    this.x_orig = x0;
    this.y_orig = y0;
    this.x_width = xwidth;
    this.y_width = ywidth;
    this.x_displ_scal = (xmax - xmin) / xwidth;
    this.y_displ_scal = (ymax - ymin) / ywidth;
    this.x_min_rel = xmin / this.x_displ_scal;
    this.x_max_rel = xmax / this.x_displ_scal;
    this.y_min_rel = ymin / this.y_displ_scal;
    this.y_max_rel = ymax / this.y_displ_scal;
    // convert to absolute coordinates
    this.x_min = this.x_min_rel + this.x_orig;
    this.x_max = this.x_max_rel + this.x_orig;
    this.y_min = this.y_orig - this.y_min_rel;
    this.y_max = this.y_orig - this.y_max_rel;
    this.txpos = this.x_orig - this.tw;
    this.typos = this.y_orig;
  }

  /**
   * Draws the graph on the canvas
   * @param {CanvasRenderingContext2D} ctx - the canvas context
   * @param {number} xmajor - major x axis grid spacing
   * @param {number} xminor - minor x axis grid spacing
   * @param {number} ymajor - major y axis grid spacing
   * @param {number} yminor - minor y axis grid spacing
   */
  drawGrid(ctx, xmajor, xminor, ymajor, yminor) {
    this.x_tick_major = xmajor / this.x_displ_scal;
    this.x_tick_minor = xminor / this.x_displ_scal;
    this.y_tick_major = ymajor / this.y_displ_scal;
    this.y_tick_minor = yminor / this.y_displ_scal;
    // draw major grid lines		ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.yy = this.y_max;
    do {
      ctx.moveTo(this.x_min, this.yy);
      ctx.lineTo(this.x_max, this.yy);
      this.yy += this.y_tick_major;
    } while (this.yy <= this.y_min);
    this.xx = this.x_min;
    do {
      ctx.moveTo(this.xx, this.y_min);
      ctx.lineTo(this.xx, this.y_max);
      this.xx += this.x_tick_major;
    } while (this.xx <= this.x_max);
    ctx.stroke();
    // draw minor grid lines
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.yy = this.y_max;
    do {
      ctx.moveTo(this.x_min, this.yy);
      ctx.lineTo(this.x_max, this.yy);
      this.yy += this.y_tick_minor;
    } while (this.yy <= this.y_min);
    this.xx = this.x_min;
    do {
      ctx.moveTo(this.xx, this.y_min);
      ctx.lineTo(this.xx, this.y_max);
      this.xx += this.x_tick_minor;
    } while (this.xx <= this.x_max);
    ctx.stroke();
    //display values
    ctx.font = "10pt Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    this.yy = this.y_max;
    do {
      this.y_displ = (this.y_orig - this.yy) * this.y_displ_scal;
      ctx.fillText(`${this.y_displ}`, this.txpos + 5, this.yy - this.th / 2);
      this.yy += this.y_tick_major;
    } while (this.yy <= this.y_min);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    this.xx = this.x_min;
    do {
      this.x_displ = (this.xx - this.x_orig) * this.x_displ_scal;
      ctx.fillText(`${this.x_displ}`, this.xx - this.tw + 10, this.typos + 5);
      this.xx += this.x_tick_major;
    } while (this.xx <= this.x_max);
  }

  /**
   * Draws the x and y axes on the canvas
   * @param {CanvasRenderingContext2D} ctx - the canvas context
   * @param {string} xlabel - x axis label
   * @param {string} ylabel - y axis label
   */
  drawAxes(ctx, xlabel, ylabel) {
    if (typeof xlabel === "undefined") xlabel = "x";
    if (typeof ylabel === "undefined") ylabel = "y";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x_min, this.y_orig);
    ctx.lineTo(this.x_max, this.y_orig);
    ctx.moveTo(this.x_orig, this.y_min);
    ctx.lineTo(this.x_orig, this.y_max);
    ctx.stroke();
    //axis labels		ctx.font = "12pt Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(xlabel, this.x_max + 0.75 * this.tw, this.typos - this.th / 2);
    ctx.fillText(
      ylabel,
      this.txpos + this.tw / 2 + 5,
      this.y_max - 1.5 * this.th,
    );
  }

  /**
   * Plots a set of points on the graph
   * @param {CanvasRenderingContext2D} ctx - the canvas context
   * @param {number[]} xArr - array of x values
   * @param {number[]} yArr - array of y values
   * @param {string} pColor - color of the points
   * @param {boolean} pDots - whether to draw dots
   * @param {boolean} pLine - whether to draw lines
   */
  plot(ctx, xArr, yArr, pColor, pDots, pLine) {
    // the last three arguments have default values
    if (typeof pColor === "undefined") pColor = "#0000ff";
    if (typeof pDots === "undefined") pDots = true;
    if (typeof pLine === "undefined") pLine = true;
    var xpos = this.x_orig + xArr[0] / this.x_displ_scal;
    var ypos = this.y_orig - yArr[0] / this.y_displ_scal;
    ctx.strokeStyle = pColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xpos, ypos);
    ctx.arc(xpos, ypos, 1, 0, 2 * Math.PI, true);
    for (var i = 1; i < xArr.length; i++) {
      xpos = this.x_orig + xArr[i] / this.x_displ_scal;
      ypos = this.y_orig - yArr[i] / this.y_displ_scal;
      if (pLine) {
        ctx.lineTo(xpos, ypos);
      } else {
        ctx.moveTo(xpos, ypos);
      }
      if (pDots) {
        ctx.arc(xpos, ypos, 1, 0, 2 * Math.PI, true);
      }
    }
    ctx.stroke();
  }
}

const gameScreen = await initGameScreen({
  cb: async ({ appId, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const canvasConfig = new CanvasConfig({
      size: { width: 700, height: 500 },
      maxSize: { width: 1024 },
    });

    await createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 mx-auto bg-white mx-auto w-full"
				style="max-width: ${canvasConfig.initial.renderMaxSize?.width}px;"
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

    const initGame = () => {
      // // Create a new Graph instance
      // // const graph = new Graph(-10, 10, -10, 10, 300, 200, 500, 350);
      // // const graph = new GraphV({
      // //   xmin: -10,
      // //   xmax: 10,
      // //   ymin: -10,
      // //   ymax: 10,
      // //   originX: canvasConfig.render.width / 2,
      // //   originY: canvasConfig.render.height / 2,
      // //   pixelWidth: canvasConfig.render.width,
      // //   pixelHeight: canvasConfig.render.height,
      // // });
      // const graph = new GraphV3(-10, 10, -10, 10, 300, 200, 500, 350);

      // // Draw the grid on the canvas (major and minor spacing values)
      // graph.drawGrid(ctx, 2, 1, 2, 1); // Major grid spacing of 2, minor grid spacing of 1 for both axes

      // // Draw the axes with labels
      // graph.drawAxes(ctx, "X-Axis", "Y-Axis");

      // // const game = new GameLoop({
      // //   fixedUpdate() {},
      // //   // Render with interpolation (alpha is fraction of leftover time, not needed here)
      // //   render() {},

      // //   name: "bounce-ball-demo",
      // // });

      // // game.start();

      // // cleanupManager.register(game.cleanup);

      const graph = new GraphV3(
        -10,
        10, // xmin, xmax
        -10,
        10, // ymin, ymax
        canvas.width / 2, // originX (centered)
        canvas.height / 2, // originY (centered)
        canvas.width,
        canvas.height,
      );

      graph.drawGrid(ctx, 1, 0.5, 1, 0.5);
      graph.drawAxes(ctx);

      // Generate some math data: y = sin(x)
      const xArr = [];
      const yArr = [];
      for (let x = -10; x <= 10; x += 0.1) {
        xArr.push(x);
        yArr.push(Math.sin(x));
      }

      // Plot the function
      graph.plot(ctx, xArr, yArr, "#f00", false, true);
    };

    const adjustCanvasCleanup = adjustCanvas({
      canvas,
      ctx,
      onUpdateCanvasSize: (boundingBox) => {
        canvasConfig.updateDomConfig(boundingBox).adjustRenderScale({
          ctx,
          ctxActions: ["scaleBasedImageSmoothing"],
          canvas,
          canvasActions: ["setSize", "setStyleWidth"],
        });

        initGame();
      },
    });
    cleanupManager.register(adjustCanvasCleanup);
  },
});

export default gameScreen;
