/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

import { CleanUpManager } from "#libs/cleanup.js";
import { adjustCanvasDimensions, loadManyImageElement } from "#libs/dom.js";

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

  const [assetsError, _assets] = await loadManyImageElement(
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

  props.appElem.innerHTML = /* HTML */ `<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${props.handleGoPrevScreen
      ? `<button id="${goBackButtonId}">Go Back</button>`
      : ""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
  </section>`;

  cleanUpManager.registerEventListener({
    elem: document.getElementById(goBackButtonId),
    type: "click",
    listener: goBack,
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
    600,
    600,
  );

  /** @type {number|undefined} */
  let animateId;

  function animate() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
