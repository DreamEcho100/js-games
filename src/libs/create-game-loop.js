/**
 * @typedef {(dt: number) => void} UpdateCallback
 * @typedef {(step: number) => void} FixedUpdateCallback
 * @typedef {() => void} RenderCallback
 *
 * @typedef {{
 *   update?: UpdateCallback,
 *   fixedUpdate?: FixedUpdateCallback,
 *   fps?: number,
 *   fixedFps?: number,
 *   maxElapsedTimeMS?: number,
 *   render: RenderCallback,
 *   onBeforeUpdate?: () => void,
 *   onAfterUpdate?: () => void,
 *   onBeforeRender?: () => void,
 *   onAfterRender?: () => void,
 *   onBeforeFixedUpdate?: () => void,
 *   onAfterFixedUpdate?: () => void,
 *   name?: string,
 *  fixedStepClamp?: number,
 * }} GameLoopOptions
 */

let nextGameLoopDefaultId = 0;

const GAME_LOOP_STATE = {
  STOPPED: 0,
  RUNNING: 1,
  PAUSED: 2,
};

export class GameLoop {
  gameLoopState = GAME_LOOP_STATE.STOPPED;
  /** @type {UpdateCallback[]} */
  updateEvents = [];
  /** @type {FixedUpdateCallback[]} */
  fixedUpdateEvents = [];
  /** @type {RenderCallback[]} */
  renderEvents = [];
  /** @type {(now: DOMHighResTimeStamp) => void} */
  loop;

  rafId = 0;
  lastTime = performance.now();
  accumulator = 0;
  frameAccumulator = 0;
  /** @type {number} */
  targetDelta;

  /**
   * Create a game loop with optional fixed-step physics and FPS-based rendering.
   * @param {GameLoopOptions} options
   */
  constructor(options) {
    this.name = options.name ?? `game-loop-${nextGameLoopDefaultId++}`;

    if (options.maxElapsedTimeMS && options.maxElapsedTimeMS <= 0) {
      throw new Error(`[${this.name}] \`maxDelta\` must be a positive number.`);
    }

    this.fps = options.fps ?? 60;
    this.fixedFps = options.fixedFps ?? this.fps;
    this.fixedStepClamp = options.fixedStepClamp ?? 5;
    this.maxElapsedTimeMS = options.maxElapsedTimeMS ?? 100;
    // this.minElapsedTimeS = options.maxElapsedTimeMS ?? 0.1;

    if (this.fixedFps > this.fps) {
      console.warn(
        `[${this.name}] Warning: fixedFps (${this.fixedFps}) > fps (${this.fps}) may cause instability.`,
      );
    }

    // Calculate target FPS delta and inverses for faster calculations
    this.targetDelta = 1 / this.fps;
    this.fixedDelta = 1 / this.fixedFps;

    this.updateEvents = /** @type {UpdateCallback[]} */ (
      [options.onBeforeUpdate, options.update, options.onAfterUpdate].filter(
        Boolean,
      )
    );
    this.fixedUpdateEvents = /** @type {FixedUpdateCallback[]} */ (
      [
        options.onBeforeFixedUpdate,
        options.fixedUpdate,
        options.onAfterFixedUpdate,
      ].filter(Boolean)
    );
    this.renderEvents = /** @type {RenderCallback[]} */ (
      [options.onBeforeRender, options.render, options.onAfterRender].filter(
        Boolean,
      )
    );

    // Main game loop
    this.loop =
      typeof options.fixedUpdate === "function"
        ? /** @param {DOMHighResTimeStamp} now */ (now) => {
            this.rafId = requestAnimationFrame(this.loop);
            if (this.gameLoopState !== GAME_LOOP_STATE.RUNNING) return;

            this.elapsedTimeMS = Math.min(
              now - this.lastTime,
              this.maxElapsedTimeMS,
            );
            this.lastTime = now;
            this.elapsedTimeS = this.elapsedTimeMS * 0.001; // delta in seconds

            // Update the game state
            for (const fn of this.updateEvents) {
              fn(this.elapsedTimeS);
            }

            // Handle physics updates at fixed intervals
            this.accumulator += this.elapsedTimeS;
            // Process fixed steps (e.g., physics updates) and accumulate remaining time, while not exceeding the clamp
            let steps = 0;
            while (
              this.accumulator >= this.fixedDelta &&
              steps < this.fixedStepClamp
            ) {
              for (const fn of this.fixedUpdateEvents) {
                fn(this.fixedDelta);
              }
              this.accumulator -= this.fixedDelta;
              steps++;
            }
            if (steps === this.fixedStepClamp) {
              console.warn(
                `[${this.name}] Fixed step clamp reached: skipping extra updates`,
              );
            }

            // FPS control for rendering
            this.frameAccumulator += this.elapsedTimeS;

            // Only render when we've accumulated enough time for a frame at target FPS
            if (this.frameAccumulator >= this.targetDelta) {
              // Reset this.accumulator, keeping remainder for smooth timing
              this.frameAccumulator -= this.targetDelta;

              for (const fn of this.renderEvents) {
                fn();
              }
            }
          }
        : /** @param {DOMHighResTimeStamp} now */ (now) => {
            this.rafId = requestAnimationFrame(this.loop);
            if (this.gameLoopState !== GAME_LOOP_STATE.RUNNING) return;

            this.elapsedTimeMS = Math.min(
              now - this.lastTime,
              this.maxElapsedTimeMS,
            );
            this.lastTime = now;
            this.elapsedTimeS = this.elapsedTimeMS * 0.001; // delta in seconds

            // Update the game state
            for (const fn of this.updateEvents) {
              fn(this.elapsedTimeS);
            }

            // FPS control for rendering
            this.frameAccumulator += this.elapsedTimeS;

            // Only render when we've accumulated enough time for a frame at target FPS
            if (this.frameAccumulator >= this.targetDelta) {
              // Reset this.accumulator, keeping remainder for smooth timing
              this.frameAccumulator -= this.targetDelta;

              for (const fn of this.renderEvents) {
                fn();
              }
            }
          };
  }
  /**
   * Starts the game loop if it isn't already running.
   * Resets the accumulator and frame accumulator.
   * The loop begins by requesting an animation frame, triggering the game update/render cycle.
   * If the game loop is already running, this method does nothing.
   *
   * @returns {void}
   */
  start() {
    if (this.gameLoopState === GAME_LOOP_STATE.RUNNING) {
      return;
    }
    this.gameLoopState = GAME_LOOP_STATE.RUNNING;
    this.accumulator = 0;
    this.frameAccumulator = 0;
    this.rafId = requestAnimationFrame((now) => {
      this.lastTime = now;
      this.rafId = requestAnimationFrame(this.loop);
    });
  }

  /**
   * Stops the game loop if it is currently running.
   * Resets the accumulator and frame accumulator.
   * Cancels any pending animation frames.
   * If the loop is not running, this method does nothing.
   *
   * @returns {void}
   */
  stop() {
    if (this.gameLoopState !== GAME_LOOP_STATE.RUNNING) {
      return;
    }
    this.accumulator = 0;
    this.frameAccumulator = 0;
    this.gameLoopState = GAME_LOOP_STATE.STOPPED;
    cancelAnimationFrame(this.rafId);
  }

  /**
   * Pauses the game loop if it is currently running.
   * Cancels the current animation frame, halting the game update/render cycle.
   * The game loop state is set to `PAUSED`, which can later be resumed.
   * If the loop is not running, this method does nothing.
   *
   * @returns {void}
   */
  pause() {
    if (this.gameLoopState !== GAME_LOOP_STATE.RUNNING) {
      return;
    }
    this.gameLoopState = GAME_LOOP_STATE.PAUSED;
    cancelAnimationFrame(this.rafId);
  }

  /**
   * Resumes the game loop if it is currently paused.
   * The game loop state is set to `RUNNING`, and a new animation frame is requested to continue the update/render cycle.
   * If the game loop is not paused, this method does nothing.
   *
   * @returns {void}
   */
  resume() {
    if (this.gameLoopState !== GAME_LOOP_STATE.PAUSED) {
      return;
    }
    this.gameLoopState = GAME_LOOP_STATE.RUNNING;
    this.rafId = requestAnimationFrame((now) => {
      this.lastTime = now;
      this.rafId = requestAnimationFrame(this.loop);
    });
  }

  getGameLoopState() {
    return this.gameLoopState;
  }

  isRunning() {
    return this.gameLoopState === GAME_LOOP_STATE.RUNNING;
  }

  isPaused() {
    return this.gameLoopState === GAME_LOOP_STATE.PAUSED;
  }

  isStopped() {
    return this.gameLoopState === GAME_LOOP_STATE.STOPPED;
  }

  // /**
  //  * Step through one iteration of the loop.
  //  * Useful for testing or debugging.
  //  */
  // step() {
  //   // this.rafId = requestAnimationFrame((now) => {
  //   // 	this.lastTime = now;
  //   // 	this.rafId = requestAnimationFrame((now) => {
  //   // 		loop(now);
  //   // 		this.stop();
  //   // 	});
  //   // });
  //   const now = performance.now();
  //   this.lastTime = now;
  //   this.loop(now);
  // }

  /**
   * Set a new target FPS for the game loop.
   * @param {number} newFPS The new target FPS
   */
  setFPS(newFPS) {
    if (Number.isNaN(newFPS) || newFPS <= 0) {
      throw new Error(`[${this.name}] FPS must be a positive number.`);
    }
    if (newFPS < this.fixedFps) {
      console.warn(
        `[${this.name}] Warning: fps (${newFPS}) < fixedFps (${this.fixedFps}) may cause instability.`,
      );
    }

    this.fps = newFPS;
    this.targetDelta = 1 / this.fps;
  }

  /**
   * Set a new fixed delta time for the game loop.
   * @param {number} newFixedFps The new fixed delta time
   */
  setFixedFps(newFixedFps) {
    if (Number.isNaN(newFixedFps) || newFixedFps <= 0) {
      throw new Error("Fixed FPS must be a positive number.");
    }
    if (newFixedFps > this.fps) {
      console.warn(
        `[${this.name}] Warning: fixedFps (${newFixedFps}) > fps (${this.fps}) may cause instability.`,
      );
    }

    this.fixedFps = newFixedFps;
    this.fixedDelta = 1 / newFixedFps;
  }

  /**
   * @param {number} newFixedStepClamp
   */
  setFixedStepClamp(newFixedStepClamp) {
    if (Number.isNaN(newFixedStepClamp) || newFixedStepClamp <= 0) {
      throw new Error("Fixed step clamp must be a positive number.");
    }

    this.fixedStepClamp = newFixedStepClamp;
  }

  /**
   * Clean up all loop internals and cancel animation frames.
   * Should be called when disposing the loop.
   */
  cleanup() {
    this.stop();

    // Null out references to help garbage collection
    this.updateEvents.length = 0;
    this.fixedUpdateEvents.length = 0;
    this.renderEvents.length = 0;

    // Replace loop with no-op to break closure reference
    this.loop = () => {};

    // Optional: clear externally exposed properties
    this.rafId = 0;
    this.lastTime = 0;
    this.accumulator = 0;
    this.frameAccumulator = 0;
  }
}

/*

### 📊 Instrumentation / Debug Tools

#### 6. **Delta Time Smoothing / Average FPS**

Add an internal FPS meter:

```js
let fps = 0;
let frameCount = 0;
let timeAccumulator = 0;

function updateFPS(delta) {
  timeAccumulator += delta;
  frameCount++;
  if (timeAccumulator >= 1) {
    fps = frameCount;
    frameCount = 0;
    timeAccumulator = 0;
  }
}
```

Expose it via `.getFPS()`.

---

#### 7. **Dev Mode Frame Logging**

Optionally log:

* Delta times
* Alpha
* Time spent in each phase (`performance.now()` diffs)
* Helps diagnose hitches.

---

#### 8. **Custom Scheduler / Frame Rate Capping**

Some games want **hard FPS capping** (e.g. for retro 30FPS aesthetics). You can:

* Use `setTimeout` hybrid with `requestAnimationFrame`.
* Track elapsed time and delay frames manually if needed.

---

### ⏳ Simulation / Prediction Features

#### 9. **Fixed Step Clamp**

Prevent runaway updates:

```js
let maxSteps = 5;
let steps = 0;
while (accumulator >= fixedFps && steps < maxSteps) {
  fixedUpdate(fixedFps);
  accumulator -= fixedFps;
  steps++;
}
```

This stops spiral-of-death when tab is backgrounded or CPU is overloaded.

---

#### 10. **Rewind or Re-simulation Support**

Harder, but store a buffer of states (ring buffer, etc.) and allow rewinding simulation for:

* Rollbacks (multiplayer)
* Replays
* Debug stepping backwards

---

### 🧠 API Ergonomics

#### 11. **Hot Reload Support**

Allow external systems (like an editor) to replace `update`, `render`, etc. at runtime:

```js
loop.setRender(newRenderFn);
```

---

### Summary: Feature Checklist

| Feature                  | Use Case                        |
| ------------------------ | ------------------------------- |
| Smoothed FPS / Profiling | Debugging, metrics              |
| Frame Logging / Timers   | Diagnose hitches                |
| Max Fixed Steps          | Spiral-of-death prevention      |
| Manual Frame Rate Cap    | Retro style, mobile perf        |
| Hot Module Reloading     | Devtools, editor integration    |
| Rewind / Prediction      | Replays, rollback netcode       |

---
*/

/*
JavaScript in the browser has its own unique challenges and constraints compared to lower-level game engines. Some of those features I listed would be challenging to implement well in pure JS:

### More Realistic JS Game Loop Enhancements

1. **requestIdleCallback integration** - Use browser idle time for non-critical tasks

2. **Frame throttling for inactive tabs** - Automatically reduce updates when the page loses focus

3. **Battery-aware processing** - Scale back operations on mobile when battery is low

4. **DevTools integration** - Custom console timing markers for performance debugging

5. **LocalStorage settings** - Save and restore loop configuration between sessions

6. **Animated property interpolation** - Helper functions for common animation needs

7. **Canvas rendering optimizations** - Automatic dirty rectangle tracking

8. **Input debouncing/buffering** - Handle input events consistently regardless of frame rate

9. **Responsive design handling** - Adjust simulation based on viewport changes

10. **Audio synchronization** - Keep audio and visual elements in sync despite timing variations
*/

/*
# Core Intentions of `createGameLoop`

1. **Separate physics from rendering** - Enables deterministic physics simulation independent of frame rate
   
2. **Provide consistent frame timing** - Controls render frequency to maintain visual consistency across devices

3. **Enable smooth interpolation** - Uses alpha values to blend between physics states for fluid animation

4. **Protect against timing instability** - Caps large delta times to prevent simulation explosions

5. **Support flexible update patterns** - Accommodates both fixed-step physics and variable-time updates

6. **Offer complete lifecycle control** - Provides start, stop, pause, and resume functionality

7. **Enable fine-grained monitoring** - Includes hooks for all phases of the game loop

8. **Allow runtime reconfiguration** - Supports changing FPS and fixed update rates during execution

9. **Facilitate debugging** - Includes step-by-step execution and named instances

10. **Maintain high performance** - Uses optimized calculations with multiplication over division
*/
