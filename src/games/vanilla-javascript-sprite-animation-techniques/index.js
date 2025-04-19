import initGameScreen from "#libs/core/dom.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { reduceToString } from "#libs/string.js";

const gameScreen = await initGameScreen({
  assetsUrls: /** @type {const} */ ([
    import.meta.resolve("./shadow_dog.png", new URL(import.meta.url)),
  ]),
  stylesheetLink: import.meta.resolve(
    "./__style.css",
    new URL(import.meta.url),
  ),
  cb: ({
    appId,
    assets,
    cleanUpManager,
    createLayout,
    goBack,
    goBackButtonId,
  }) => {
    const animationsControlId = `animations-${appId}`;
    const animationsControlGroupId = `animations-group-${appId}`;

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
    const canvasSizes = { width: 600, height: 600 };

    createLayout(/* html */ `<canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${canvasSizes.width}"
			height="${canvasSizes.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
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
        cleanUpManager.registerEventListener({
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
      document.getElementById("vanillaJavascriptSpriteAnimationTechniques")
    );

    if (!canvas) {
      throw new Error("Couldn't find the canvas!");
    }

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );

    let staggerFrame = 5;
    let frameAcc = 0;

    /** @type {number|undefined} */
    let animateId;

    function animate() {
      let positionX =
        Math.floor(frameAcc / staggerFrame) %
        playerAnimationsStates[currentAnimation].locations.length;
      const frameX = playerImageDW * positionX;
      const frameY =
        playerAnimationsStates[currentAnimation].locations[positionX].y;

      ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);
      ctx.drawImage(
        playerImage,
        frameX,
        frameY,
        playerImageDW,
        playerImageDH,
        0,
        0,
        canvasSizes.width,
        canvasSizes.height,
      );

      frameAcc++;

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
