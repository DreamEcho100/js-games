/** @import { CleanupManager } from "#libs/cleanup.js"; */

import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas, CanvasConfig } from "#libs/dom/index.js";

/**
 * ========================================================
 * CHARACTER MOVEMENT AND POSITIONING
 * ========================================================
 *
 * COORDINATE SYSTEMS IN GAMES
 * ============================
 * In our game, there are TWO coordinate systems working together:
 *
 * 1. TILE COORDINATES - Whole number grid positions (e.g., [3, 4])
 *    - Represent which grid cell the character occupies
 *    - Used for gameplay logic (collisions, path finding, etc.)
 *
 * 2. PIXEL COORDINATES - Exact screen positions (e.g., [128, 176])
 *    - Represent the exact visual position on screen
 *    - Used for rendering/drawing
 *
 * Visual representation:
 *
 * Tile Coordinates [3, 4]:
 * +---+---+---+---+---+
 * |0,0|1,0|2,0|3,0|4,0|
 * +---+---+---+---+---+
 * |0,1|1,1|2,1|3,1|4,1|
 * +---+---+---+---+---+
 * |0,2|1,2|2,2|3,2|4,2|
 * +---+---+---+---+---+
 * |0,3|1,3|2,3|3,3|4,3|
 * +---+---+---+---+---+
 * |0,4|1,4|2,4|3,4|4,4| <-- Character at tile [3,4]
 * +---+---+---+---+---+
 *
 * Pixel Coordinates [128, 176] (assuming 40px tiles):
 * (0,0)          (40,0)         (80,0)        (120,0)        (160,0)
 *   +---------------+---------------+---------------+---------------+
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   +---------------+---------------+---------------+---------------+
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   +---------------+---------------+---------------+---------------+
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   +---------------+---------------+---------------+---------------+
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   +---------------+---------------+---------------+---------------+
 *   |               |               |               |      P        | <-- Character at pixel [128,176]
 *   |               |               |               |               |
 *   |               |               |               |               |
 *   +---------------+---------------+---------------+---------------+
 *  (0,160)        (40,160)       (80,160)      (120,160)      (160,160)
 */
class Character {
  /**
   * The Character class handles:
   * 1. Tracking both tile and pixel positions
   * 2. Smooth movement between tiles
   * 3. Processing keyboard input
   * 4. Collision detection with map tiles
   *
   * @param {{
   *   registerEvents: (options: {
   *     keydownCb: (e: KeyboardEvent) => void;
   *     keyupCb: (e: KeyboardEvent) => void;
   *   }) => void;
   *   tile: { w: number; h: number };
   * }} options
   */
  constructor(options) {
    /**
     * The tile coordinates where the character is coming from
     * This represents the current/starting grid cell
     *
     * In a 2D grid, [x, y] where:
     * - x = column number (horizontal position)
     * - y = row number (vertical position)
     *
     * Example: [1, 1] means the character is at the tile in the
     * second column, second row (0-based indexing)
     *
     * +---+---+---+
     * |0,0|1,0|2,0|
     * +---+---+---+
     * |0,1|1,1|2,1| <-- Character is here
     * +---+---+---+
     * |0,2|1,2|2,2|
     * +---+---+---+
     */
    this.tileFrom = /** @type {[x: number, y: number]} */ ([1, 1]);

    /**
     * The tile coordinates where the character is moving to
     * When not moving, tileFrom and tileTo are the same
     * When moving, they differ, and we animate between them
     *
     * Example: If tileFrom is [1, 1] and tileTo is [2, 1],
     * the character is moving right one tile
     *
     * +---+---+---+
     * |0,0|1,0|2,0|
     * +---+---+---+
     * |0,1|1,1|2,1| <-- Moving from (1,1) to (2,1)
     * +---+---+---+  [tileFrom]    [tileTo]
     * |0,2|1,2|2,2|
     * +---+---+---+
     */
    this.tileTo = /** @type {[x: number, y: number]} */ ([1, 1]);

    /**
     * The exact pixel coordinates on the screen
     * This is the precise visual position of the character
     *
     * Example: [45, 45] means 45px from left edge and 45px from top edge
     * This would position the character in the center of a 40x40 tile at [1,1]
     * because we add a small offset for centering (see placeAt method)
     *
     * Visual:
     * (0,0)                     (80,0)
     *   +------------------------+
     *   |                        |
     *   |   +----+               |
     *   |   |    |               |
     *   |   | P  |               | <-- Character at pixel [45,45]
     *   |   |    |               |     centered in tile [1,1]
     *   |   +----+               |
     *   |                        |
     *   +------------------------+
     */
    this.position = /** @type {[x: number, y: number]} */ ([45, 45]);

    /**
     * The dimensions of the character (width and height) in pixels
     * Usually smaller than the tile size to create visual padding
     *
     * Example: [30, 30] for a character inside 40x40 tiles gives a
     * 5px buffer on each side
     *
     * +------------------+ <-- 40x40 Tile
     * |                  |
     * |    +--------+    |
     * |    |        |    |
     * |    |   P    |    | <-- 30x30 Character
     * |    |        |    |
     * |    +--------+    |
     * |                  |
     * +------------------+
     */
    this.dimensions = /** @type {[w: number, h:number]} */ ([
      30, // options.tile.w * 0.65,
      30, // options.tile.h * 0.65,
    ]);

    /**
     * The timestamp when movement began (in milliseconds)
     * Used to calculate the progress of animated movement
     *
     * Example: If current time is 1000ms and timeMoved is 800ms,
     * then the character has been moving for 200ms
     */
    this.timeMoved = 0;

    /**
     * How long a movement from one tile to another should take (in milliseconds)
     * Lower values = faster movement; Higher values = slower movement
     *
     * Example: 300ms means it takes 0.3 seconds to move between tiles
     *
     * Timeline visualization:
     *
     * 0ms                                300ms
     * |-------------------------------------|
     * Start                               End
     * Movement                         Movement
     * (tileFrom)                       (tileTo)
     */
    this.delayMove = 300;

    /**
     * Maps direction names to keyboard keys
     * This allows for easy reference in code and makes
     * key rebinding simpler to implement later
     */
    this.directionKeyMap = {
      up: "ArrowUp",
      right: "ArrowRight",
      down: "ArrowDown",
      left: "ArrowLeft",
    };

    /**
     * Collection of all direction keys
     * This makes it easy to iterate through all movement keys
     */
    this.KeysCollection = Object.values(this.directionKeyMap);

    /**
     * Maps keyboard keys to directions and their pressed state
     * The structure is: { "KeyCode": ["direction", isPressed] }
     *
     * Example: { "ArrowUp": ["up", false] } means the up arrow
     * corresponds to the "up" direction and is currently not pressed
     */
    this.keyDirectionMap = Object.fromEntries(
      Object.entries(this.directionKeyMap).map((item) => [
        item[1],
        [item[0], false],
      ]),
    );

    /**
     * Register keyboard event handlers
     * This sets up the key press detection for character movement
     *
     * Keyboard state tracking:
     *
     * ┌───────────┐
     * │   ↑(up)   │ ← When pressed: keyDirectionMap["ArrowUp"][1] = true
     * ├───┬───┬───┤   When released: keyDirectionMap["ArrowUp"][1] = false
     * │ ← │ ↓ │ → │
     * └───┴───┴───┘
     */
    options.registerEvents({
      keydownCb: (e) => {
        if (e.key in this.keyDirectionMap) {
          this.keyDirectionMap[e.key][1] = true;
        }
      },
      keyupCb: (e) => {
        if (e.key in this.keyDirectionMap) {
          this.keyDirectionMap[e.key][1] = false;
        }
      },
    });
  }

  /**
   * Places the character at a specific tile position
   *
   * This method:
   * 1. Sets both the source and destination tile to the same position
   * 2. Calculates the corresponding pixel position, with centering
   * 3. Updates the character's position immediately (no animation)
   *
   * VISUAL EXAMPLE:
   * If we call placeAt(tile, 2, 3) with 40x40 tiles and 30x30 character:
   *
   * Step 1: Set tile coordinates
   * tileFrom = [2, 3]
   * tileTo = [2, 3]
   *
   * Step 2: Calculate pixel position with centering
   * x = 2 * 40 + (40 - 30) * 0.5 = 80 + 5 = 85
   * y = 3 * 40 + (40 - 30) * 0.5 = 120 + 5 = 125
   *
   * Result: Character positioned at pixel [85, 125]
   *
   * +---+---+---+---+
   * |0,0|1,0|2,0|3,0|
   * +---+---+---+---+
   * |0,1|1,1|2,1|3,1|
   * +---+---+---+---+
   * |0,2|1,2|2,2|3,2|
   * +---+---+---+---+
   * |0,3|1,3|2,3|3,3| <-- Character at [2,3]
   * +---+---+---+---+    centered at pixel [85,125]
   *
   * @param {{ w: number; h: number }} tile - Tile dimensions
   * @param {number} x - Target tile x-coordinate
   * @param {number} y - Target tile y-coordinate
   */
  placeAt(tile, x, y) {
    // We change the tile position to the new tile position
    this.tileFrom = /** @type {[number, number]} */ ([x, y]);

    // We set the tile to the new tile position
    this.tileTo = /** @type {[number, number]} */ ([x, y]);

    // Then `position` is set to the new tile position
    this.position = /** @type {[number, number]} */ ([
      // `x` is multiplied by the tile width + the padding
      // (half the difference between the tile width and the character width)
      Math.floor(x * tile.w + (tile.w - this.dimensions[0]) * 0.5),

      // `y` is multiplied by the tile height + the padding
      // (half the difference between the tile height and the character height)
      Math.floor(y * tile.h + (tile.h - this.dimensions[1]) * 0.5),
    ]);
  }

  /**
   * Processes character movement between tiles
   *
   * This is what creates smooth animation as the character moves
   * from one tile to another, rather than teleporting instantly.
   *
   * HOW ANIMATION WORKS:
   * ====================
   * 1. Check if a movement is in progress (tileFrom != tileTo)
   * 2. Calculate how much time has elapsed since movement began
   * 3. Calculate progress as a value from 0.0 (start) to 1.0 (end)
   * 4. Use linear interpolation (lerp) to find the current position
   *
   * VISUAL EXAMPLE:
   * Moving from tile [1,1] to [2,1] over 300ms:
   *
   * Time:   0ms      100ms     200ms     300ms
   * Progress: 0%       33%       66%      100%
   * Position: [45,45]  [58,45]  [72,45]  [85,45]
   *
   * +--------+--------+
   * |        |        |
   * |    [P→ → → →]   |
   * |        |        |
   * +--------+--------+
   *
   * The formula for the intermediate position is:
   * Start position + (progress × distance)
   *
   * @param {{ w: number; h: number }} tile - Tile dimensions
   * @param {number} currentFrameTime - Current game time in milliseconds
   * @returns {boolean} - True if still moving, false if not moving
   */
  processMovement(tile, currentFrameTime) {
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
      this.placeAt(tile, this.tileTo[0], this.tileTo[1]);
    } else {
      // Calculate movement progress (0.0 to 1.0)
      const progress = elapsed / this.delayMove;

      /**
       * Update x position based on progress
       *
       * EXAMPLE:
       * - Moving from tile [1,1] to [2,1] (moving right)
       * - Tile width = 40px
       * - Character width = 30px
       * - 50% progress (progress = 0.5)
       *
       * Step 1: Calculate tile distance
       * tileDistance = 2 - 1 = 1 (moving 1 tile right)
       *
       * Step 2: Calculate move distance with progress
       * moveDistance = 1 * 0.5 = 0.5 (moved half a tile)
       *
       * Step 3: Calculate new pixel position
       * position[0] = (1 + 0.5) * 40 + (40 - 30) * 0.5
       *             = 1.5 * 40 + 5
       *             = 60 + 5
       *             = 65
       *
       * Result: Character is halfway between tiles at pixel x=65
       */
      if (this.tileTo[0] !== this.tileFrom[0]) {
        const tileDistance = this.tileTo[0] - this.tileFrom[0];
        const moveDistance = tileDistance * progress;

        this.position[0] = Math.floor(
          (this.tileFrom[0] + moveDistance) * tile.w +
            (tile.w - this.dimensions[0]) * 0.5,
        );
      }

      // Update y position based on progress (same logic as x)
      if (this.tileTo[1] !== this.tileFrom[1]) {
        const tileDistance = this.tileTo[1] - this.tileFrom[1];
        const moveDistance = tileDistance * progress;

        this.position[1] = Math.floor(
          (this.tileFrom[1] + moveDistance) * tile.h +
            (tile.h - this.dimensions[1]) * 0.5,
        );
      }
    }

    return true; // Still moving
  }

  /**
   * Converts 2D tile coordinates to a 1D index in the map array
   *
   * The map data is stored as a flat 1D array, but we think of it
   * as a 2D grid. This function converts between these formats.
   *
   * VISUAL EXAMPLE:
   * For a map with width = 4:
   *
   * 2D Grid:               1D Array:
   * +----+----+----+----+  +----+----+----+----+----+----+----+----+----+...
   * | 0,0| 1,0| 2,0| 3,0|  | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  |...
   * +----+----+----+----+  +----+----+----+----+----+----+----+----+----+...
   * | 0,1| 1,1| 2,1| 3,1|
   * +----+----+----+----+
   * | 0,2| 1,2| 2,2| 3,2|
   * +----+----+----+----+
   *
   * Formula: index = y * width + x
   *
   * Example: Tile [2,1] -> 1 * 4 + 2 = 6
   * So tile [2,1] is at index 6 in the 1D array
   *
   * @param {{ w: number; h: number }} map - Map dimensions
   * @param {number} x - Tile x-coordinate
   * @param {number} y - Tile y-coordinate
   * @returns {number} - The index in the 1D map array
   */
  toMapIndex(map, x, y) {
    return y * map.w + x;
  }

  /**
   * Updates the character's position based on input and game state
   *
   * This is the main function that:
   * 1. Processes ongoing movement (if any)
   * 2. Checks for new movement input
   * 3. Handles collision detection with map walls
   * 4. Initiates new movement if possible
   *
   * MOVEMENT SEQUENCE EXAMPLE:
   * 1. Player presses right arrow
   * 2. Check if the tile to the right is walkable (value 1)
   * 3. If yes, set tileTo to the new position and record movement time
   * 4. During subsequent updates, processMovement handles the animation
   * 5. When animation completes, character snaps to final position
   *
   * @param {{ w: number; h: number }} tile - Tile dimensions
   * @param {{ w: number; h: number }} map - Map dimensions
   * @param {number[]} gameMap - 1D array of map data (0 = wall, 1 = path)
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   * @param {Record<string, number>} floorTypes
   * @param {number} currentFrameTime - Current game time in milliseconds
   */
  update(tile, map, gameMap, tileTypes, floorTypes, currentFrameTime) {
    // Process ongoing movement first
    const isMoving = this.processMovement(tile, currentFrameTime);

    // Only check for new movement if not already ongoing
    if (isMoving) {
      return;
    }

    // Check each direction key
    for (const key of this.KeysCollection) {
      const [direction, isPressed] = this.keyDirectionMap[key];

      // Skip keys that aren't pressed
      if (!isPressed) continue;

      // Try to move in the pressed direction
      let hadMoved = false;

      /**
       * Direction-specific movement logic with collision detection
       *
       * For each direction, we:
       * 1. Check if moving would stay within map boundaries
       * 2. Check if the destination tile is walkable (value 1)
       * 3. If both checks pass, update tileTo and mark as moved
       *
       * VISUAL EXAMPLE:
       * - Character at [1,1]
       * - Trying to move up (decrease y)
       * - Map has a wall (0) at [1,0]
       *
       * +---+---+---+
       * |   |███|   | <-- Wall at [1,0], can't move up
       * +---+---+---+
       * |   | P |   | <-- Character at [1,1]
       * +---+---+---+
       * |   |   |   |
       * +---+---+---+
       */
      switch (direction) {
        // Can move up if: not at top row, destination is a path
        case "up":
          if (
            this.canMoveUp(map, gameMap, tileTypes, floorTypes)
            // &&
            // this.tileFrom[1] > 0 &&
            // gameMap[
            //   this.toMapIndex(map, this.tileFrom[0], this.tileFrom[1] - 1)
            // ] == 1
          ) {
            this.tileTo[1] -= 1;
            hadMoved = true;
          }
          break;
        // Similar logic for other directions...
        case "down":
          if (
            this.canMoveDown(map, gameMap, tileTypes, floorTypes)
            // &&
            // this.tileFrom[1] < map.h - 1 &&
            // gameMap[
            //   this.toMapIndex(map, this.tileFrom[0], this.tileFrom[1] + 1)
            // ] == 1
          ) {
            this.tileTo[1] += 1;
            hadMoved = true;
          }
          break;
        case "left":
          if (
            this.canMoveLeft(map, gameMap, tileTypes, floorTypes)
            // &&
            // this.tileFrom[0] > 0 &&
            // gameMap[
            //   this.toMapIndex(map, this.tileFrom[0] - 1, this.tileFrom[1])
            // ] == 1
          ) {
            this.tileTo[0] -= 1;
            hadMoved = true;
          }
          break;
        case "right":
          if (
            this.canMoveRight(map, gameMap, tileTypes, floorTypes)
            // &&
            // this.tileFrom[0] < map.w - 1 &&
            // gameMap[
            //   this.toMapIndex(map, this.tileFrom[0] + 1, this.tileFrom[1])
            // ] == 1
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

  /**
   * Draws the character on the canvas
   *
   * This renders the character as a blue rectangle at its current
   * pixel position (which may be mid-animation between tiles).
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {[number, number]} [offset] - Viewport offset for scrolling
   */
  draw(ctx, offset = [0, 0]) {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(
      offset[0] + this.position[0],
      offset[1] + this.position[1],
      this.dimensions[0],
      this.dimensions[1],
    );
  }

  /**
   * Checks if the character can move to a specific tile
   *
   * @param {{ w: number; h:number }} map
   * @param {number[]} gameMap
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   * @param {Record<string, number>} floorTypes
   * @param {number} x - The tile x-coordinate
   * @param {number} y - The tile y-coordinate
   * @returns {boolean} - True if the character can move to the tile, false otherwise
   */
  canMoveTo(map, gameMap, tileTypes, floorTypes, x, y) {
    if (x < 0 || x >= map.w || y < 0 || y >= map.h) {
      return false;
    }

    if (
      tileTypes[gameMap[this.toMapIndex(map, x, y)]].floor !== floorTypes.path
    ) {
      return false;
    }

    return true;
  }
  /**
	//  * 
  //  * @param {{ w: number; h:number }} map
  //  * @param {number[]} gameMap
  //  * @param {Record<number, { color: string; floor: number }>} tileTypes
  //  * @param {Record<string, number>} floorTypes
   */
  canMoveUp(map, gameMap, tileTypes, floorTypes) {
    return this.canMoveTo(
      map,
      gameMap,
      tileTypes,
      floorTypes,
      this.tileFrom[0],
      this.tileFrom[1] - 1,
    );
  }
  /**
   * @param {{ w: number; h:number }} map
   * @param {number[]} gameMap
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   * @param {Record<string, number>} floorTypes
   */
  canMoveDown(map, gameMap, tileTypes, floorTypes) {
    return this.canMoveTo(
      map,
      gameMap,
      tileTypes,
      floorTypes,
      this.tileFrom[0],
      this.tileFrom[1] + 1,
    );
  }
  /**
   * @param {{ w: number; h:number }} map
   * @param {number[]} gameMap
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   * @param {Record<string, number>} floorTypes
   */
  canMoveLeft(map, gameMap, tileTypes, floorTypes) {
    return this.canMoveTo(
      map,
      gameMap,
      tileTypes,
      floorTypes,
      this.tileFrom[0] - 1,
      this.tileFrom[1],
    );
  }
  /**
   * @param {{ w: number; h:number }} map
   * @param {number[]} gameMap
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   * @param {Record<string, number>} floorTypes
   */
  canMoveRight(map, gameMap, tileTypes, floorTypes) {
    return this.canMoveTo(
      map,
      gameMap,
      tileTypes,
      floorTypes,
      this.tileFrom[0] + 1,
      this.tileFrom[1],
    );
  }
}

/**
 * ========================================================
 * THE VIEWPORT SYSTEM - COMPREHENSIVE EXPLANATION
 * ========================================================
 *
 * WHAT IS A VIEWPORT?
 * ===================
 * A viewport acts as a "camera" or "window" into our game world.
 * In most games, the world is much larger than what can fit on the screen.
 * The viewport determines which portion of that world is currently visible.
 *
 * Visual representation of a viewport:
 *
 * +------------------------------------------+  <-- Complete game world (large)
 * |                                          |
 * |      +----------------------+            |
 * |      |                      |            |
 * |      |       VIEWPORT       |            |
 * |      |    (visible area)    |            |
 * |      |                      |            |
 * |      +----------------------+            |
 * |                                          |
 * +------------------------------------------+
 *
 * WHY DO WE NEED CULLING?
 * =======================
 * Culling = selectively drawing only what's visible
 *
 * Without culling, we'd waste processing power drawing tiles that
 * aren't even on screen. This becomes a significant performance issue
 * when dealing with large maps.
 *
 * +---------------------+
 * |                     |
 * |  XXXXXXXXXXXXXXXXX  |  X = Visible tiles (drawn)
 * |  XXXXXXXXXXXXXXXXX  |  . = Off-screen tiles (culled)
 * |  XXXXXXXXXXXXXXXXX  |
 * |                     |
 * +---------------------+
 *
 * ..........................  <-- These off-screen tiles are NOT drawn,
 * ..........................      saving significant processing power
 *
 *
 *
 * ========================================================
 * SUMMARY OF VIEWPORT BENEFITS
 * ========================================================
 *
 * 1. PERFORMANCE OPTIMIZATION
 *    - Only drawing what's visible (culling) reduces CPU/GPU load
 *    - Critical for larger maps (imagine drawing a 1000x1000 tile map!)
 *
 * 2. CAMERA CONTROL
 *    - Allows smooth scrolling as player moves
 *    - Keeps player centered on screen
 *    - Handles edge cases (map boundaries)
 *
 * 3. COORDINATE SYSTEM MANAGEMENT
 *    - Converts between world coordinates and screen coordinates
 *    - Makes it easy to position entities correctly
 *
 * This viewport implementation is a fundamental building block
 * for any tile-based game with a map larger than the screen.
 */
class Viewport {
  /**
   * The Viewport class handles:
   * 1. Determining which part of the map is visible on screen
   * 2. Calculating offsets for drawing entities at the correct position
   * 3. Culling off-screen tiles to improve performance
   *
   * Here's a visualization of what happens:
   *
   * The Viewport determines which portion of the game map is currently visible on screen.
   * Think of it as a camera that follows the player around the game world.
   *
   * +----------------+ <-- This is our screen/viewport
   * |                |
   * |      +--+      |
   * |      |P |      | <-- The player (P) is typically centered in the viewport
   * |      +--+      |
   * |                |
   * +----------------+
   *
   * The large map below is the full game world, but we only show a small portion of it on screen.
   *
   * +-----------------------+
   * |                       |
   * |   +----------------+  |
   * |   |                |  |
   * |   |      +--+      |  |
   * |   |      |P |      |  | <-- Our viewport showing only a portion of the map
   * |   |      +--+      |  |
   * |   |                |  |
   * |   +----------------+  |
   * |                       |
   * +-----------------------+
   *                           <-- Full game map (much larger than the viewport)
   *
   * @param {{
   *   screen: [number, number]; // The width and height of the visible area in pixels
   * }} props - Configuration options for the viewport
   */
  constructor(props) {
    /**
     * The dimensions of the screen in pixels [width, height]
     * This defines how large our "window" into the game world is
     * @type {[number, number]}
     */
    this.screen = props.screen;

    /**
     * The tile coordinates of the top-left corner of the viewport
     * These are the first tiles we'll draw when rendering the map
     * @type {[number, number]}
     */
    this.startTile = [0, 0];

    /**
     * The tile coordinates of the bottom-right corner of the viewport
     * These are the last tiles we'll draw when rendering the map
     * @type {[number, number]}
     */
    this.endTile = [0, 0];

    /**
     * The pixel offset for drawing
     * Used to position all map elements correctly within the viewport
     * @type {[number, number]}
     */
    this.offset = [0, 0];
  }

  /**
   * Updates the viewport position to center around a specific game world coordinate
   *
   * This is how the "camera" follows the player as they move around the game world.
   *
   * =====================================
   * HOW CENTERING THE VIEWPORT WORKS
   * =====================================
   *
   * Step 1: We have a player at position (px, py) in the game world
   * Step 2: We want to center the viewport on this player
   * Step 3: We calculate offsets to make the player appear centered
   * Step 4: We determine which tiles need to be drawn (culling)
   *
   * ASCII representation of viewport calculation:
   *
   * When player is in the middle of the map:
   *
   * Game Map (20×20 tiles):
   * +--------------------+
   * |                    |
   * |                    |
   * |      Viewport      |
   * |   +------------+   |
   * |   |            |   |
   * |   |     P      |   | <-- Viewport centered on player (P)
   * |   |            |   |
   * |   +------------+   |
   * |                    |
   * |                    |
   * +--------------------+
   *
   * @param {{ w: number; h: number }} tile - Tile dimensions (width, height) in pixels
   * @param {{ w: number; h: number }} map - Map dimensions in tiles (width, height)
   * @param {number} px - The x-coordinate in pixels to center the viewport around (usually player's position)
   * @param {number} py - The y-coordinate in pixels to center the viewport around (usually player's position)
   */
  update(tile, map, px, py) {
    /**
     * STEP 1: Calculate drawing offsets to center the view on the player
     *
     * The math behind this:
     * --------------------
     * We want the player to appear at the center of the screen.
     * If the screen is 400px wide, the center is at 200px.
     *
     * If the player is at pixel position 500 in the game world:
     * offset = 200 - 500 = -300px
     *
     * This means we need to shift everything 300px left so that
     * the player (at position 500) will appear at position 200 (center).
     *
     * Before offset:  0px      200px                500px
     *                 |         |                     |
     *                 |    screen center        player position
     *
     * After offset:   |<------ -300px ----->|
     *                -300px     0px         200px
     *                           |            |
     *                       screen start   player now at center
     *
     * This is just like moving a camera - we're not moving the player,
     * we're moving the entire world to make the player centered.
     */
    this.offset[0] = Math.floor(this.screen[0] * 0.5 - px);
    this.offset[1] = Math.floor(this.screen[1] * 0.5 - py);

    /**
     * STEP 2: Find the tile coordinates the player is standing on
     *
     * We convert pixel coordinates to tile coordinates by dividing
     * by the tile dimensions and flooring the result.
     *
     * Example:
     * If tiles are 40x40 pixels and player is at pixel (500, 300):
     * playerTile.x = floor(500/40) = 12
     * playerTile.y = floor(300/40) = 7
     *
     * This means the player is standing on tile (12, 7)
     */
    const playerTile = [Math.floor(px / tile.w), Math.floor(py / tile.h)];

    /**
     * STEP 3: Calculate the first (top-left) tile that should be visible
     *
     * We start with the player's tile, then go back by:
     * - Half the screen width in tiles
     * - Plus 1 extra tile for partial visibility
     *
     * Example with 400px screen, 40px tiles, player at tile x=12:
     * startTile.x = 12 - 1 - ceil((400/2)/40) = 12 - 1 - 5 = 6
     *
     * ASCII diagram:
     *
     *    startTile                 playerTile       endTile
     *        v                         v               v
     *    +---+---+---+---+---+---+---+---+---+---+---+---+
     *    | 6 | 7 | 8 | 9 |10 |11 |12 |13 |14 |15 |16 |17 |
     *    +---+---+---+---+---+---+---+---+---+---+---+---+
     *    |   |               viewport                |   |
     *    |   +-----------------------------------+   |   |
     *    |   |                                   |   |   |
     *    |   |                                   |   |   |
     *    |   |                P                  |   |   |
     *    |   |                                   |   |   |
     *    |   |                                   |   |   |
     *    |   +-----------------------------------+   |   |
     *
     *
     *
     * Another Example with 400px screen, 40px tiles, player at tile x=12:
     * startTile.x = 12 - 1 - ceil((400/2)/40) = 12 - 1 - 5 = 6
     *
     * Visual representation:
     *
     * Tiles:    0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17
     *           |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
     *                               |<------ visible tiles ------>|
     *                               ^                             ^
     *                           startTile                      playerTile
     */
    this.startTile[0] =
      playerTile[0] - 1 - Math.ceil((this.screen[0] * 0.5) / tile.w);
    this.startTile[1] =
      playerTile[1] - 1 - Math.ceil((this.screen[1] * 0.5) / tile.h);
    /**
     * STEP 4: Make sure we don't try to draw tiles that are outside the map bounds
     *
     * If our calculation gives us a negative index, we adjust to start at 0
     * because we can't draw tiles with negative indices.
     *
     * Example:
     * If startTile.x is calculated as -2, we adjust it to 0
     *
     * Map boundary clamping:
     *
     * Without clamping:       With clamping:
     * +------------------+    +------------------+
     * |                  |    |                  |
     * |                  |    |                  |
     * |              P   |    |              P   |
     * |                  |    |                  |
     * |                  |    |                  |
     * +------------------+    +------------------+
     *  \________________/      \________________/
     *    Beyond map edge       Starts at map edge
     */
    if (this.startTile[0] < 0) this.startTile[0] = 0;
    if (this.startTile[1] < 0) this.startTile[1] = 0;

    /**
     * STEP 5: Calculate the last (bottom-right) tile that should be visible
     *
     * Similar to step 3, but we go forward from the player's tile.
     *
     * Example with same parameters:
     * endTile.x = 12 + 1 + ceil((400/2)/40) = 12 + 1 + 5 = 18
     *
     * Visual representation:
     *
     * Tiles:    0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18
     *           |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
     *                               |<-------------- visible tiles ------------->|
     *                               ^                 ^                          ^
     *                           startTile         playerTile                  endTile
     */
    this.endTile[0] =
      playerTile[0] + 1 + Math.ceil((this.screen[0] * 0.5) / tile.w);
    this.endTile[1] =
      playerTile[1] + 1 + Math.ceil((this.screen[1] * 0.5) / tile.h);

    /**
     * STEP 6: Make sure we don't try to draw tiles beyond the map boundaries
     *
     * Example:
     * If map is 20 tiles wide and endTile.x is calculated as 22,
     * we adjust it to 20 to stay within bounds.
     *
     * Edge case handling:
     *
     * Without clamping:       With clamping:
     * +------------------+    +------------------+
     * |                  |    |                  |
     * |                  |    |                  |
     * |P                 |    |P                 |
     * |                  |    |                  |
     * |                  |    |                  |
     * +------------------+    +------------------+
     *  \_________________\     \________________/
     *    Beyond map edge       Ends at map edge
     */
    if (this.endTile[0] >= map.w) this.endTile[0] = map.w;
    if (this.endTile[1] >= map.h) this.endTile[1] = map.h;

    /**
     * At this point, we have:
     * - The visible tile range (startTile to endTile)
     * - The drawing offset to position everything correctly
     *
     * When drawing, we'll only loop through and render these visible tiles,
     * skipping all off-screen tiles (this is called "culling" and improves performance)
     */

    /**
     * OPTIMIZATION RESULT:
     * --------------------
     * Instead of drawing all 400 tiles in a 20x20 map, we might only
     * draw 100 tiles (10x10 viewport). This is a 75% reduction in
     * rendering work!
     *
     * Before culling:         After culling:
     * +------------------+    +------------------+
     * |XXXXXXXXXXXXXXXXXX|    |.................|
     * |XXXXXXXXXXXXXXXXXX|    |...XXXXXXXXXX....|
     * |XXXXXXXXXXXXXXXXXX|    |...XXXXXXXXXX....|
     * |XXXXXXXXXXXXXXXXXX|    |...XXXXXXXXXX....|
     * |XXXXXXXXXXXXXXXXXX|    |...XXXXXXXXXX....|
     * +------------------+    |...XXXXXXXXXX....|
     *                         |...XXXXXXXXXX....|
     *                         |...XXXXXXXXXX....|
     *                         |...XXXXXXXXXX....|
     *                         |.................|
     *                         +------------------+
     *
     * X = Tiles being drawn
     * . = Tiles NOT being drawn (culled)
     */
  }

  /**
   * Draws the visible portion of the map onto the canvas
   *
   * Based on the calculated viewport, this only draws the tiles that are
   * actually visible on screen - All other tiles are "culled" _(skipped, a technique called "culling" that
   * greatly improves performance for large maps)_.
   *
   * +---+---+---+---+---+---+   Map tiles outside the
   * |   |   |   |   |   |   |   viewport (startTile to endTile)
   * +---+---+---+---+---+---+   are culled (not drawn),
   * |   |###|###|###|###|   |   saving processing power.
   * +---+###########|###|---+
   * |   |###|   |   |###|   |   ### = Visible tiles that
   * +---+###|---+---+###|---+   get drawn on the canvas
   * |   |###|###|###|###|   |
   * +---+---+---+---+---+---+
   * |   |   |   |   |   |   |
   * +---+---+---+---+---+---+
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {{ w: number; h: number }} tile - Tile dimensions in pixels
   * @param {{ w: number; h: number }} map - Map dimensions in tiles
   * @param {number[]} gameMap - The map data (0 = wall, 1 = path)
   * @param {Record<number, { color: string; floor: number }>} tileTypes
   */
  draw(ctx, tile, map, gameMap, tileTypes) {
    /**
     * Loop only through the visible tiles (culling optimization)
     *
     * Instead of:
     * for (let y = 0; y < map.h; y++) {
     *   for (let x = 0; x < map.w; x++) {
     *     // Draw every tile
     *   }
     * }
     *
     * We only process the visible subset:
     */
    for (let y = this.startTile[1]; y <= this.endTile[1]; y++) {
      for (let x = this.startTile[0]; x <= this.endTile[0]; x++) {
        // Draw tiles...
        // Choose tile color based on map data
        const tileType = tileTypes[gameMap[y * map.w + x]];
        if (!tileType) {
          continue;
        }
        ctx.fillStyle = tileType.color;

        /**
         * Draw the tile at the correct position using the offset
         *
         * How the offset works:
         * ---------------------
         * Remember our offset (calculated in update()) shifts everything
         * to center the player.
         *
         * For example, if offset is [-300, -200]:
         * - A tile at world position [500, 400] would be drawn at [200, 200]
         * - This puts it right in the center of a 400x400 screen
         *
         * The math:
         * worldPos + offset = screenPos
         * [500, 400] + [-300, -200] = [200, 200]
         */
        ctx.fillRect(
          Math.floor(this.offset[0] + x * tile.w), // X position = offset + tile position
          Math.floor(this.offset[1] + y * tile.h), // Y position = offset + tile position
          tile.w + 0.9, // Tile width - adding `0.9` to avoid gaps between tiles when moving :(
          tile.h + 0.9, // Tile height - adding `0.9` to avoid gaps between tiles when moving :(
        );
      }
    }
  }
}

/**
 * ========================================================
 * TILE-BASED GAME STRUCTURE
 * ========================================================
 *
 * WHAT IS A TILE-BASED GAME?
 * ===========================
 * A tile-based game divides the world into a grid of uniform cells (tiles).
 * Each tile represents a specific type of terrain or object.
 * This approach simplifies many aspects of game development:
 *
 * 1. COLLISION DETECTION is simplified to tile checking
 * 2. LEVEL DESIGN becomes a matter of placing tiles
 * 3. PATHFINDING can use grid algorithms (A*, Dijkstra's)
 * 4. MEMORY USAGE is optimized through tileset reuse
 *
 * THE MAP STRUCTURE
 * =================
 * The game map is structured as a 1D array representing a 2D grid:
 *
 * [0,0,0,0,0,0,0,0,0,0,
 *  0,1,1,1,0,1,1,1,1,0,
 *  0,1,0,0,0,1,0,0,0,0,
 *  ...]
 *
 * Where:
 * - 0 = Wall (non-walkable)
 * - 1 = Path (walkable)
 *
 * Visualized as a 2D grid:
 *
 * +---+---+---+---+---+
 * |███|███|███|███|███| <-- Walls (0)
 * +---+---+---+---+---+
 * |███|   |   |   |███| <-- Paths (1)
 * +---+---+---+---+---+
 * |███|   |███|███|███|
 * +---+---+---+---+---+
 * |███|   |   |   |███|
 * +---+---+---+---+---+
 * |███|███|███|███|███|
 * +---+---+---+---+---+
 *
 * CONVERTING BETWEEN COORDINATE SYSTEMS
 * =====================================
 * The game needs to convert between different coordinate systems:
 *
 * 1. TILE TO PIXEL:
 *    pixelX = tileX * tileWidth + (tileWidth - characterWidth) * 0.5
 *    pixelY = tileY * tileHeight + (tileHeight - characterHeight) * 0.5
 *
 * 2. PIXEL TO TILE:
 *    tileX = Math.floor(pixelX / tileWidth)
 *    tileY = Math.floor(pixelY / tileHeight)
 *
 * 3. 2D COORDINATES TO 1D ARRAY INDEX:
 *    index = y * mapWidth + x
 *
 * VISUAL EXAMPLE:
 * For a map with 40x40 tiles and a 20x20 grid:
 *
 * Tile [2,3] would be:
 * - Array index: 3 * 20 + 2 = 62
 * - Pixel position (top-left): [80, 120]
 * - Pixel position (centered, 30x30 character): [85, 125]
 */

/**
 * @param {{
 *  ctx: CanvasRenderingContext2D;
 *  canvasConfig: CanvasConfig;
 *  cleanupManager: CleanupManager;
 * }} props
 */
function initGame({ ctx, canvasConfig, cleanupManager }) {
  let currentSecond = 0;
  let frameCount = 0;
  let frameLastSecond = 0;
  let lastFrameTime = 0;

  // // prettier-ignore
  // const gameMap = [
  // 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  // 	0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 0, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 1, 0, 0, 1, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 0, 0, 0, 1, 1, 0, 0,
  // 	0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
  // 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  // ]
  //
  // // prettier-ignore
  // const gameMap = [
  // 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  // 	0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
  // 	0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0,
  // 	0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0,
  // 	0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
  // 	0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0,
  // 	0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0,
  // 	0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0,
  // 	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  // 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  // ];
  // prettier-ignore
  const gameMap = [
		0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 2, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2, 2, 0,
		0, 2, 3, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2, 2, 0,
		0, 2, 3, 1, 4, 4, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 0,
		0, 2, 3, 1, 1, 4, 4, 1, 2, 3, 3, 2, 1, 1, 2, 1, 0, 0, 0, 0,
		0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 0,
		0, 1, 1, 1, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0,
		0, 1, 1, 1, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0,
		0, 1, 1, 1, 1, 2, 4, 4, 4, 4, 4, 1, 1, 1, 2, 2, 2, 2, 1, 0,
		0, 1, 1, 1, 1, 2, 3, 2, 1, 1, 4, 1, 1, 1, 1, 3, 3, 2, 1, 0,
		0, 1, 2, 2, 2, 2, 1, 2, 1, 1, 4, 1, 1, 1, 1, 1, 3, 2, 1, 0,
		0, 1, 2, 3, 3, 2, 1, 2, 1, 1, 4, 4, 4, 4, 4, 4, 4, 2, 4, 4,
		0, 1, 2, 3, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0,
		0, 1, 2, 3, 4, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 0,
		0, 3, 2, 3, 4, 4, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 1, 0,
		0, 3, 2, 3, 4, 4, 3, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 3, 0,
		0, 3, 2, 3, 4, 1, 3, 2, 1, 3, 1, 1, 1, 2, 1, 1, 1, 2, 3, 0,
		0, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 1, 2, 2, 2, 2, 2, 3, 0,
		0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 4, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
	];

  const FLOOR_TYPES = {
    solid: 0,
    path: 1,
    water: 2,
  };
  const TILE_TYPES = {
    0: { color: "#685b48", floor: FLOOR_TYPES.solid, name: "wall" },
    1: { color: "#5aa457", floor: FLOOR_TYPES.path, name: "path" },
    2: { color: "#e8bd7a", floor: FLOOR_TYPES.path, name: "grass" },
    3: { color: "#286625", floor: FLOOR_TYPES.solid, name: "tree" },
    4: { color: "#678fd9", floor: FLOOR_TYPES.water, name: "water" },
  };

  const tile = {
    w: 40,
    h: 40,
  };
  const map = {
    w: 20,
    h: 20,
  };

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
    tile,
  });
  ctx.font = "bold 10pt sans-serif";

  const viewport = new Viewport({
    screen: [canvasConfig.render.width, canvasConfig.render.height],
  });

  /** @type {number|undefined} */
  let animateId;
  function animate() {
    ctx.clearRect(0, 0, canvasConfig.render.width, canvasConfig.render.height);

    const currentFrameTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timeElapsed = currentFrameTime - lastFrameTime;

    const sec = Math.floor(Date.now() * 0.001);
    if (sec !== currentSecond) {
      currentSecond = sec;
      frameLastSecond = frameCount;
      frameCount = 1;
    } else {
      frameCount++;
    }

    character.update(
      tile,
      map,
      gameMap,
      TILE_TYPES,
      FLOOR_TYPES,
      currentFrameTime,
    );
    viewport.update(
      tile,
      map,
      character.position[0] + character.dimensions[0] / 2,
      character.position[1] + character.dimensions[1] / 2,
    );

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, viewport.screen[0], viewport.screen[1]);
    viewport.draw(ctx, tile, map, gameMap, TILE_TYPES);
    character.draw(ctx, viewport.offset);

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
}

/**
 * ========================================================
 * SUMMARY
 * ========================================================
 *
 * CHARACTER POSITIONING SYSTEM
 * ===========================
 * - tileFrom/tileTo: Grid coordinates for logical positioning
 * - position: Pixel coordinates for visual positioning
 * - Animation between tiles creates smooth movement
 *
 * MOVEMENT SYSTEM
 * ===============
 * 1. Detect key presses
 * 2. Check if movement is allowed (boundaries, collisions)
 * 3. Update destination tile (tileTo)
 * 4. Animate movement over time using linear interpolation
 *
 * TILE-BASED STRUCTURE BENEFITS
 * ============================
 * - Simplifies collision detection
 * - Makes level design easier
 * - Optimizes rendering through viewport culling
 * - Provides a natural grid for gameplay mechanics
 *
 * Together, these systems create a foundation for a wide
 * variety of 2D games, from RPGs to puzzle games to strategy games.
 */

/**
 * @template {Record<string, any>} TItem
 * @typedef {{
 *	[P in TItem[keyof TItem]]: {
 *			[Key in keyof TItem]: TItem[Key] extends P ? Key : never
 *		}[keyof TItem]
 * }} ReverseRecord
 */
const gameScreen = await initGameScreen({
  cb: async ({ appId, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;

    const canvasConfig = new CanvasConfig({
      size: { width: 400, height: 400 },
      maxSize: { width: 1024 },
    });

    await createLayout(/* html */ `<small class='block text-center'><em>In Progress</em></small><canvas
				id="${canvasId}"
				width="${canvasConfig.render.width}"
				height="${canvasConfig.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 mx-auto w-full"
				style="max-width: ${canvasConfig.initial.renderMaxSize?.width}px;"
			></canvas>`);

    const canvas = /** @type {HTMLCanvasElement|null} */ (
      document.getElementById(canvasId)
    );
    if (!canvas) {
      throw new Error("Couldn't find the canvas!");
    }
    canvas.style.imageRendering = "pixelated";

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );
    if (!ctx) {
      throw new Error("Couldn't get the canvas context!");
    }
    // ctx.translate(1, 1); // Aligns stroke/fill operations to pixel boundaries
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    // ctx.filter =
    //   // "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aXR5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)";
    //   `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="f" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer></filter></svg>#f')`;

    ctx.imageSmoothingEnabled = false;

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
      },
    });
    cleanupManager.register(adjustCanvasCleanup);

    initGame({
      ctx,
      canvasConfig,
      cleanupManager,
    });
  },
});

export default gameScreen;
