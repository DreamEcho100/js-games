/**
 * @import { ScreenHandlerParams } from "#libs/types/core.js";
 * @import { MirrorTupleWith } from "#libs/types/common.js";
 */

import { buttonPrimaryClassName } from "#libs/class-names.js";
import { CleanUpManager } from "#libs/cleanup.js";
import { injectStylesheetLink, loadManyImageElement } from "#libs/dom.js";
// import { generateSpriteAnimationStates } from "#libs/sprite.js";
// import { reduceToString } from "#libs/string.js";

/**
 * @template {string[]|undefined} TAssetPaths
 * @param {{
 *  stylesheetLink?: string;
 *  assetsUrls?: TAssetPaths;
 *  cb: (props: {
 * 		assets: MirrorTupleWith<NonNullable<TAssetPaths>, HTMLImageElement, []>;
 *    cleanUpManager: CleanUpManager;
 * 		appId: string;
 * 		goBackButtonId: string;
 * 		goBack: () => void;
 * 		createLayout: (children: string) => void;
 * 	}) => Promise<void> | void;
 * }} initOptions
 * @returns {Promise<(props: ScreenHandlerParams) => Promise<void>>}
 */
export default async function initGameScreen(initOptions) {
  const appId = `app-${Math.random().toString(32)}`;
  const goBackButtonId = `go-back-${appId}`;
  const cleanUpManager = new CleanUpManager();
  if (initOptions.stylesheetLink) {
    injectStylesheetLink(initOptions.stylesheetLink, cleanUpManager);
  }

  return async (props) => {
    function goBack() {
      props.handleGoPrevScreen?.();
      cleanUpManager.cleanUp();
    }

    let assets =
      /** @type {MirrorTupleWith<NonNullable<TAssetPaths>, HTMLImageElement, []>} */ (
        undefined
      );
    if (initOptions.assetsUrls) {
      const [assetsError, _assets] = await loadManyImageElement(
        initOptions.assetsUrls,
      );
      props.appElem.innerHTML = `
			<section class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</section>
			`;

      if (assetsError) {
        console.error(assetsError);
        props.appElem.innerHTML = /* html */ `<section
				class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
			>
				${
          props.handleGoPrevScreen
            ? `<button id="${goBackButtonId}" class="${buttonPrimaryClassName}">Go Back</button><br /><br />`
            : ""
        }
				<p class="text-center">Couldn't load the image!</p>
				<button id="reload" class="${buttonPrimaryClassName}">Reload</button>
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
            initGameScreen(initOptions);
          },
        });
        return;
      }
      assets = _assets;
    }

    /** @param {string} children */
    const createLayout = (children) =>
      (props.appElem.innerHTML = /* html */ `<section
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${
      props.handleGoPrevScreen
        ? `<button id="${goBackButtonId}" class="${buttonPrimaryClassName}">Go Back</button>`
        : ""
    }
		${children}
	</section>`);

    cleanUpManager.registerEventListener({
      elem: document.getElementById(goBackButtonId),
      type: "click",
      listener: goBack,
      silent: process.env.NODE_ENV !== "production",
    });

    return initOptions.cb({
      assets:
        /** @type {MirrorTupleWith<NonNullable<TAssetPaths>, HTMLImageElement, []>} */ (
          assets
        ),
      cleanUpManager,
      appId,
      goBackButtonId,
      goBack,
      createLayout,
    });
  };

  // const canvas = /** @type {HTMLCanvasElement|null} */ (
  //   document.getElementById("vanillaJavascriptSpriteAnimationTechniques")
  // );

  // if (!canvas) {
  //   throw new Error("Couldn't find the canvas!");
  // }

  // const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

  // let staggerFrame = 5;
  // let frameAcc = 0;

  // /** @type {number|undefined} */
  // let animateId;

  // function animate() {
  //   let positionX =
  //     Math.floor(frameAcc / staggerFrame) %
  //     playerAnimationsStates[currentAnimation].locations.length;
  //   const frameX = playerImageDW * positionX;
  //   const frameY =
  //     playerAnimationsStates[currentAnimation].locations[positionX].y;

  //   ctx.clearRect(0, 0, canvasSizes.width, canvasSizes.height);
  //   ctx.drawImage(
  //     playerImage,
  //     frameX,
  //     frameY,
  //     playerImageDW,
  //     playerImageDH,
  //     0,
  //     0,
  //     canvasSizes.width,
  //     canvasSizes.height,
  //   );

  //   frameAcc++;

  //   animateId = requestAnimationFrame(animate);
  // }

  // cleanUpManager.register(() => {
  //   if (!animateId) {
  //     return;
  //   }
  //   cancelAnimationFrame(animateId);
  // });

  // animate();
}
