/** @import { ScreenHandlerParams } from "#utils/types.js"; */

import {
  addStyleSheetLinkToHead,
  buildSpriteAnimationsStates,
  createImage,
} from "#utils/index.js";

/** @param {ScreenHandlerParams} props */
export default async function vanillaJavascriptSpriteAnimationTechniques(
  props,
) {
  const appId = `app-${Math.random().toString(32)}`;
  const goBackButtonId = `go-back-${appId}`;
  const animationsControlId = `animations-${appId}`;
  const animationsControlGroupId = `animations-group-${appId}`;

  const stylesheetLink = addStyleSheetLinkToHead(
    import.meta.resolve("./__style.css", new URL(import.meta.url)),
  );

  const {
    image: playerImage,
    sourceWidth: playerImageSourceWidth,
    sourceHeight: playerImageSourceHeight,
  } = await createImage(
    import.meta.resolve("./shadow_dog.png", new URL(import.meta.url)),
  );

  const playerImageDW = playerImageSourceWidth / 12 + 2;
  const playerImageDH = playerImageSourceHeight / 10;
  const playerAnimationsStates = buildSpriteAnimationsStates(
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

  props.appElem.innerHTML = /* HTML */ `<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${props.handleGoPrevScreen
      ? `<button id="${goBackButtonId}">Go Back</button><br /><br />`
      : ""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-black aspect-square size-[37.5rem] max-w-full mx-auto"
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
        ${Object.keys(playerAnimationsStates)
          .map(
            (animation) => `<div class="flex items-center w-fit">
				<input type="radio" name="animations" id="${animation}" value="${animation}" ${
              currentAnimation === animation ? "checked" : ""
            } />
					<label for="${animation}" class='ps-2'>${animation}</label>
					</div>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;

  document
    .getElementById(animationsControlGroupId)
    ?.querySelectorAll("input[type='radio']")
    .forEach((radio) => {
      // /** @type {HTMLSelectElement|null} */
      // (document.getElementById(animationsControlId)) ?
      radio.addEventListener("change", (e) => {
        currentAnimation = /** @type {keyof typeof playerAnimationsStates} */ (
          /** @type {HTMLInputElement} */ (e.target).value
        );
        frameAcc = 0;
      });
    });

  document.getElementById(goBackButtonId)?.addEventListener("click", () => {
    props.handleGoPrevScreen?.();
    stylesheetLink.remove();
  });

  const canvas = /** @type {HTMLCanvasElement|null} */ (
    document.getElementById("vanillaJavascriptSpriteAnimationTechniques")
  );

  if (!canvas) {
    throw new Error("Couldn't find the canvas!");
  }

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
  const CANVAS_WIDTH = (canvas.width = 600);
  const CANVAS_HEIGHT = (canvas.height = 600);

  if (!ctx) {
    throw new Error("Couldn't find the `ctx`!");
  }

  let staggerFrame = 5;
  let frameAcc = 0;

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

    // if (frameAcc % staggerFrame === 0) {
    //   frameX++;
    //   if (frameX > 5) {
    //     frameX = 0;
    //     frameY++;
    //     if (frameY > 5) {
    //       frameY = 0;
    //     }
    //   }
    // }
    frameAcc++;

    requestAnimationFrame(animate);
  }

  animate();
}
