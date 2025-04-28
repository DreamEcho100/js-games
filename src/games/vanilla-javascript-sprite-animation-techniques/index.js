import initGameScreen from "#libs/core/dom.js";
import { adjustCanvas } from "#libs/dom/index.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { reduceToString } from "#libs/string.js";

// Project title: Vanilla JavaScript sprite animation techniques
// Project description: This project demonstrates how to create sprite animations using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.
// Project tags: animation, sprite, canvas, sprite-animation

const gameScreen = await initGameScreen({
  assetsInfo: /** @type {const} */ ([
    {
      type: "image",
      src: import.meta.resolve("./shadow_dog.png", new URL(import.meta.url)),
    },
  ]),
  stylesheetLink: import.meta.resolve(
    "./__style.css",
    new URL(import.meta.url),
  ),
  cb: ({ appId, assets, cleanupManager, createLayout }) => {
    const canvasId = `${appId}-canvas`;
    const animationsControlId = `${appId}-animations`;
    const animationsControlGroupId = `${appId}-animations-group`;

    const [playerImage] = assets;
    const playerImageSourceWidth = playerImage.naturalWidth;
    const playerImageSourceHeight = playerImage.naturalHeight;
    const playerImageDW = playerImageSourceWidth / 12 + 2;
    const playerImageDH = playerImageSourceHeight / 10;
    const playerAnimationsStates = generateSpriteAnimationStates(
      [
        { name: "idle", frames: 7 },
        { name: "jump", frames: 7 },
        { name: "fall", frames: 7 },
        { name: "run", frames: 9 },
        { name: "dizzy", frames: 11 },
        { name: "sit", frames: 5 },
        { name: "roll", frames: 7 },
        { name: "bite", frames: 7 },
        { name: "ko", frames: 12 },
        { name: "getHit", frames: 4 },
      ],
      { width: playerImageDW, height: playerImageDH },
    );
    /** @type {keyof typeof playerAnimationsStates} */
    let currentAnimation = "idle";

    const canvasConfig = {
      render: {
        width: 600,
        height: 600,
      },
      // The canvas bounding box is the bounding box of the canvas element
      // in the DOM. It is used to calculate the position of the canvas element
      // in the DOM and to adjust its size.
      dom: {
        width: 600,
        height: 600,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
      },
    };

    createLayout(/* html */ `<canvas
			id="${canvasId}"
			width="${canvasConfig.render.width}"
			height="${canvasConfig.render.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 mx-auto max-w-full w-5xl"
		></canvas>
		<div
			class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
			id="${animationsControlGroupId}"
		>
			<label for="animations">Choose an animation:</label>
			<!--
<select
				id="${animationsControlId}"
				class="border border-solid border-black"
			>
				${Object.keys(playerAnimationsStates)
          .map(
            (animation) =>
              `<option value="${animation}" >${animation}</option>`,
          )
          .join("")}
			</select>
			-->
			<div
				class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
			>
				${reduceToString(
          Object.keys(playerAnimationsStates),
          (animation) => `<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${animation}" value="${animation}" ${
            currentAnimation === animation ? "checked" : ""
          } />
							<label for="${animation}" class='ps-2'>${animation}</label>
							</div>`,
        )}
			</div>
		</div>`);

    document
      .getElementById(animationsControlGroupId)
      ?.querySelectorAll("input[type='radio']")
      .forEach((radio) => {
        cleanupManager.registerEventListener({
          elem: radio,
          type: "change",
          listener: (e) => {
            currentAnimation =
              /** @type {keyof typeof playerAnimationsStates} */ (
                /** @type {HTMLInputElement} */ (e.target).value
              );
            frameAcc = 0;
          },
        });
      });

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

    let staggerFrame = 5;
    let frameAcc = 0;

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      let positionX =
        Math.floor(frameAcc / staggerFrame) %
        playerAnimationsStates[currentAnimation].size;
      const frameX = playerImageDW * positionX;
      const frameY =
        playerAnimationsStates[currentAnimation].locations[positionX].y;

      ctx.clearRect(
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );
      ctx.drawImage(
        playerImage,
        frameX,
        frameY,
        playerImageDW,
        playerImageDH,
        0,
        0,
        canvasConfig.render.width,
        canvasConfig.render.height,
      );

      frameAcc++;

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
