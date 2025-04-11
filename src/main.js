// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

const appElem = /**@type {HTMLDivElement} */ (document.querySelector("#app"));

if (!appElem) {
  throw new Error("Couldn't find the app element!");
}

if (process.env.NODE_ENV === "development") {
  (await import("./games/enemy-movement-patterns/index.js")).default({
    appElem,
  });
} else {
  /** @param {() => Promise<{ default: (params: ScreenHandlerParams) => void }>} cb */
  function lazyLoad(cb) {
    return cb().then(
      /** @param {{ default: (params: ScreenHandlerParams) => void; }} param0  */
      ({ default: module }) => {
        module({
          handleGoPrevScreen: () => {
            appElem.innerHTML = baseScreen;
          },
          appElem,
        });
      },
    );
  }

  const pathsCB = {
    vanillaJavascriptSpriteAnimationTechniques: {
      title: "Vanilla JavaScript sprite animation techniques",
      cb: () =>
        lazyLoad(() =>
          import(
            "./games/vanilla-javascript-sprite-animation-techniques/index.js"
          ),
        ),
    },
    parallaxBackgroundsWithJavascript: {
      title: "Parallax backgrounds with JavaScript",
      cb: () =>
        lazyLoad(() =>
          import("./games/parallax-backgrounds-with-javascript/index.js"),
        ),
    },
    enemyMovementPatterns: {
      title: "Enemy movement patterns",
      cb: () =>
        lazyLoad(() => import("./games/enemy-movement-patterns/index.js")),
    },
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.pathsCB = pathsCB;

  let listItemsStr = "";
  for (const [key, value] of Object.entries(pathsCB)) {
    listItemsStr += `<li><button onclick="pathsCB.${key}.cb()">${value.title}</button></li>`;
  }

  const baseScreen = /* html */ `
<section class="grid place-items-center min-h-[100dvh] max-w-screen-xl mx-auto p-8 text-center overflow-y-auto">
  <ul>
    ${listItemsStr}
  </ul>
</section>
`;
  appElem.innerHTML = baseScreen;
}
