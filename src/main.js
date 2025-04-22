// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

import { buttonPrimaryClassName } from "#libs/class-names.js";

const appElem = /**@type {HTMLDivElement} */ (document.querySelector("#app"));

if (!appElem) {
  throw new Error("Couldn't find the app element!");
}

if (process.env.NODE_ENV === "development") {
  (await import("./games/point-and-shoot-game/index.js")).default({
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

  const gameScreens = [
    {
      title: "🕹 Project 1: Vanilla JavaScript sprite animation techniques",
      cb: () =>
        lazyLoad(() =>
          import(
            "./games/vanilla-javascript-sprite-animation-techniques/index.js"
          ),
        ),
      description:
        "This project demonstrates how to create sprite animations using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.",
      tags: ["animation", "sprite", "canvas", "html", "css", "javascript"],
    },
    {
      title: "🕹 Project 2: Parallax backgrounds with JavaScript",
      cb: () =>
        lazyLoad(() =>
          import("./games/parallax-backgrounds-with-javascript/index.js"),
        ),
      description:
        "This project demonstrates how to create parallax backgrounds using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.",
      tags: ["parallax", "backgrounds", "canvas", "javascript", "css", "html"],
    },
    {
      title: "🕹 Project 3: Enemy movement patterns",
      cb: () =>
        lazyLoad(() => import("./games/enemy-movement-patterns/index.js")),
      description:
        "This project demonstrates how to create enemy movement patterns using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.",
      tags: [
        "enemy",
        "movement",
        "patterns",
        "canvas",
        "javascript",
        "css",
        "html",
      ],
    },
    {
      title: "🕹 Project 4: Collision animations from a sprite sheet",
      cb: () =>
        lazyLoad(() =>
          import("./games/collision-animations-from-a-sprite-sheet/index.js"),
        ),
      description:
        "This project demonstrates how to create collision animations using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.",
      tags: [
        "collision",
        "animations",
        "sprite",
        "sheet",
        "canvas",
        "javascript",
        "css",
        "html",
      ],
    },
    {
      title:
        "🕹 Project 5: Point & shoot game <small><em>In Progress</em></small>",
      cb: () => lazyLoad(() => import("./games/point-and-shoot-game/index.js")),
      description:
        "This project demonstrates how to create a point and shoot game using JavaScript. It includes a simple game where the player can control a character and make it perform different animations.",
      tags: [
        "collision-detection",
        "hit-detection",
        "collision",
        "detection",
        "hit",
        "hit-box",
        "shooting",
        "canvas",
        "javascript",
        "css",
        "html",
      ],
    },
    {
      title: "🕹 Project 6: Enemy AI",
      cb: () => lazyLoad(() => import("./games/point-and-shoot-game/index.js")),
    },
  ];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.pathsCB = gameScreens;

  let listItemsStr = "";
  for (let i = 0; gameScreens.length > i; i++) {
    const { title } = gameScreens[i];
    listItemsStr += `<li><button onclick="pathsCB[${i}].cb()" class="${buttonPrimaryClassName}">${title}</button></li>`;
  }

  const baseScreen = /* html */ `
<section class="grid place-items-center min-h-[100dvh] max-w-screen-xl mx-auto p-8 text-center overflow-y-auto">
  <ul class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] w-full">
    ${listItemsStr}
  </ul>
</section>
`;
  appElem.innerHTML = baseScreen;
}
