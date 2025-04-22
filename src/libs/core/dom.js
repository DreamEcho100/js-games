/**
 * @import { ScreenHandlerParams } from "#libs/types/core.js";
 * @import {  TLoadAsset, TElementTypeMapperForAssets } from "#libs/types/common.js";
 */

import { buttonPrimaryClassName } from "#libs/class-names.js";
import { CleanupManager } from "#libs/cleanup.js";
import { injectStylesheetLink, loadManyAssets } from "#libs/dom/index.js";
// import { generateSpriteAnimationStates } from "#libs/sprite.js";
// import { reduceToString } from "#libs/string.js";

/**
 * @template {TLoadAsset[]|undefined} TAssetPaths
 * @param {{
 *  stylesheetLink?: string;
 *  assetsInfo?: TAssetPaths;
 *  cb: (props: {
 * 		assets: TAssetPaths extends TLoadAsset[] ? TElementTypeMapperForAssets<TAssetPaths> : never;
 *    cleanupManager: CleanupManager;
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

  const appId = `app-${Math.random().toString(36).slice(2)}`;
  const goBackButtonId = `${appId}-go-back-button`;
  const cleanupManager = new CleanupManager();
  if (initOptions.stylesheetLink) {
    injectStylesheetLink(initOptions.stylesheetLink, cleanupManager);
  }

  return async (props) => {
    function goBack() {
      props.handleGoPrevScreen?.();
      cleanupManager.cleanup();
    }

    let assets = /** @type {TCurrentAssets} */ (undefined);
    if (initOptions.assetsInfo) {
      props.appElem.innerHTML = /* html */ `
			<main class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</main>
			`;

      const [assetsError, _assets] = await loadManyAssets(
        initOptions.assetsInfo,
      );

      if (assetsError) {
        console.error(assetsError);
        props.appElem.innerHTML = /* html */ `<main
				class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
			>
				${
          props.handleGoPrevScreen
            ? `<button id="${goBackButtonId}" class="${buttonPrimaryClassName}">Go Back</button><br /><br />`
            : ""
        }
				<p class="text-center">Couldn't load the image!</p>
				<button id="reload" class="${buttonPrimaryClassName}">Reload</button>
			</main>`;
        cleanupManager.registerEventListener({
          elem: document.getElementById(goBackButtonId),
          type: "click",
          listener: goBack,
          silent: process.env.NODE_ENV !== "production",
        });
        cleanupManager.registerEventListener({
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
      props.appElem.innerHTML = /* html */ `<main
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${
      props.handleGoPrevScreen
        ? `<button id="${goBackButtonId}" class="${buttonPrimaryClassName}">Go Back</button>`
        : ""
    }
		${children}
	</main>`;

      cleanupManager.registerEventListener({
        elem: document.getElementById(goBackButtonId),
        type: "click",
        listener: goBack,
        silent: process.env.NODE_ENV !== "production",
      });
    };

    return initOptions.cb({
      assets: /** @type {TCurrentAssets} */ (assets),
      cleanupManager,
      appId,
      goBackButtonId,
      goBack,
      createLayout,
    });
  };
}
