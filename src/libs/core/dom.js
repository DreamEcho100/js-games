/**
 * @import { ScreenHandlerParams } from "#libs/types/core.js";
 * @import {  TLoadAsset, TElementTypeMapperForAssets } from "#libs/types/common.js";
 */

import { buttonPrimaryClassName } from "#libs/class-names.js";
import { CleanUpManager } from "#libs/cleanup.js";
import { injectStylesheetLink, loadManyAssets } from "#libs/dom.js";
// import { generateSpriteAnimationStates } from "#libs/sprite.js";
// import { reduceToString } from "#libs/string.js";

/**
 * @template {TLoadAsset[]|undefined} TAssetPaths
 * @param {{
 *  stylesheetLink?: string;
 *  assetsInfo?: TAssetPaths;
 *  cb: (props: {
 * 		assets: TAssetPaths extends TLoadAsset[] ? TElementTypeMapperForAssets<TAssetPaths> : never;
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
  /** @typedef {TAssetPaths extends TLoadAsset[] ? TElementTypeMapperForAssets<TAssetPaths> : never} TCurrentAssets */

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

    let assets = /** @type {TCurrentAssets} */ (undefined);
    if (initOptions.assetsInfo) {
      props.appElem.innerHTML = `
			<section class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</section>
			`;

      const [assetsError, _assets] = await loadManyAssets(
        initOptions.assetsInfo,
      );

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
      assets = /** @type {TCurrentAssets} */ (_assets);
    }

    /** @param {string} children */
    const createLayout = (children) => {
      props.appElem.innerHTML = /* html */ `<section
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${
      props.handleGoPrevScreen
        ? `<button id="${goBackButtonId}" class="${buttonPrimaryClassName}">Go Back</button>`
        : ""
    }
		${children}
	</section>`;

      cleanUpManager.registerEventListener({
        elem: document.getElementById(goBackButtonId),
        type: "click",
        listener: goBack,
        silent: process.env.NODE_ENV !== "production",
      });
    };

    return initOptions.cb({
      assets: /** @type {TCurrentAssets} */ (assets),
      cleanUpManager,
      appId,
      goBackButtonId,
      goBack,
      createLayout,
    });
  };
}
