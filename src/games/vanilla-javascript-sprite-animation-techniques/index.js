/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

import { CleanUpManager } from "#libs/cleanup.js";
import {
  adjustCanvasDimensions,
  injectStylesheetLink,
  loadManyImageElement,
} from "#libs/dom.js";
import { generateSpriteAnimationStates } from "#libs/sprite.js";
import { reduceToString } from "#libs/string.js";

/** @param {ScreenHandlerParams} props */
export default async function vanillaJavascriptSpriteAnimationTechniques(
  props,
) {
  const appId = `app-${Math.random().toString(32)}`;
  const goBackButtonId = `go-back-${appId}`;
  const animationsControlId = `animations-${appId}`;
  const animationsControlGroupId = `animations-group-${appId}`;

  function goBack() {
    props.handleGoPrevScreen?.();
    cleanUpManager.cleanUp();
  }

  const cleanUpManager = new CleanUpManager();

  injectStylesheetLink(
    import.meta.resolve("./__style.css", new URL(import.meta.url)),
    cleanUpManager,
  );

  props.appElem.innerHTML = `
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;

  const [assetsError, assets] = await loadManyImageElement(
    /** @type {const} */ ([
      import.meta.resolve("./shadow_dog.png", new URL(import.meta.url)),
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
  const canvasConfig = { width: 600, height: 600 };

  props.appElem.innerHTML = /* HTML */ `<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${props.handleGoPrevScreen
      ? `<button id="${goBackButtonId}">Go Back</button>`
      : ""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${canvasConfig.width}"
      height="${canvasConfig.height}"
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
          (animation) => `<option value="${animation}" >${animation}</option>`,
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
    </div>
  </section>`;

  cleanUpManager.registerEventListener({
    elem: document.getElementById(goBackButtonId),
    type: "click",
    listener: goBack,
    silent: process.env.NODE_ENV !== "production",
  });

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

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  const [CANVAS_WIDTH, CANVAS_HEIGHT] = adjustCanvasDimensions(
    canvas,
    ctx,
    canvasConfig.width,
    canvasConfig.height,
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

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(
      playerImage,
      frameX,
      frameY,
      playerImageDW,
      playerImageDH,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
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
}
