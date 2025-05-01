// import { initializeTodoApp } from "#/libs/spa/example";
/** @import { ScreenHandlerParams } from "#libs/types/core.js"; */

// import "view-transitions-polyfill";

if (!("startViewTransition" in document)) {
  /**
   * @param {ViewTransitionUpdateCallback} callbackOptions
   * @returns {ViewTransition}
   */
  window.document.startViewTransition = (callbackOptions) => {
    callbackOptions();
    return {
      ready: Promise.resolve(void 0),
      finished: Promise.resolve(void 0),
      skipTransition: () => {},
      updateCallbackDone: Promise.resolve(void 0),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      types: new Set(),
    };
  };
}

import { buttonPrimaryClassName } from "#libs/class-names.js";

const selectedGameScreenLsKey = "selectedGameScreen";
const appElem = /**@type {HTMLDivElement} */ (document.querySelector("#app"));

if (!appElem) {
  throw new Error("Couldn't find the app element!");
}

// initializeTodoApp(appElem);

/** @param {() => Promise<{ default: (params: ScreenHandlerParams) => void }>} cb */
function lazyLoad(cb) {
  return cb().then(
    /** @param {{ default: (params: ScreenHandlerParams) => void; }} param0  */
    ({ default: module }) => {
      module({
        handleGoPrevScreen: () => {
          localStorage.removeItem(selectedGameScreenLsKey);

          document.startViewTransition(() => {
            appElem.innerHTML = baseScreen;
          });
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
  // {
  //   title: "🕹 Project 6: Enemy AI <small><em>In Progress</em></small>",
  //   cb: () => lazyLoad(() => import("./games/Enemy AI/index.js")),
  // },
  {
    title:
      "Tile based game development in Javascript & Canvas <small><em>In Progress</em></small>",
    cb: () =>
      lazyLoad(() =>
        import(
          "./games/tile-based-game-development-in-javascript-and-canvas/index.js"
        ),
      ),
    description:
      "This project demonstrates how to create a tile based game using Javascript and Canvas. It includes a simple game where the player can control a character and make it perform different animations. Note: if the website is not working maybe try to open on the wayback machine :P.",
    tags: [
      "@technologies4me999",
      "tile",
      "based",
      "game",
      "development",
      "javascript",
      "canvas",
      "html",
      "css",
    ],
    references: [
      // 1st
      {
        title: "Tile based game development in Javascript & Canvas #1",
        url: "https://youtu.be/txUvD5_ROIU",
        description:
          "The first part in my tutorial series on beginner tile based game development, this episode looks at getting set up to draw a simple tile map to a Canvas element on a web page using Javascript.",
      },
      {
        title: "Drawing a Tile Map - Canvas & Javascript",
        url: "https://technologies4.me/articles/tile-map-canvas-javascript-a1/",
        description:
          "Discover the basics of tile maps, using Canvas and Javascript. In this tutorial we'll learn how to draw a simple Tile Map to an HTML Canvas.",
      },
      // 2nd
      {
        title: "Tile based game development in Javascript & Canvas #2",
        url: "https://www.youtube.com/watch?v=xsNdwyuuSzo",
        description:
          "In the second part of the tile based game development basics series, we look at adding a character which the player can move around the map with the arrow keys.",
      },
      {
        title: "Character, Movement and Input on a Tile Map",
        url: "https://technologies4.me/articles/character-movement-input-tile-map-a2/",
        description:
          "We now look at adding a Character and converting user input to movement in our tile map tutorial.",
      },
      // 3rd
      {
        title:
          "Viewport, Camera, and Culling on 2D TileMap - Javascript & Canvas gamedev #3",
        url: "https://www.youtube.com/watch?v=KL4unLXkxCs",
        description:
          "In the third part of our Javascript & Canvas tile based game development tutorial, we look at culling, cameras, and the viewport to allowing using maps that are larger than the drawing area of the screen whilst drawing the portion that is visible to the player.",
      },
      {
        title: "Viewport and Culling on a Tile Map",
        url: "https://technologies4.me/articles/viewport-culling-tile-map-a3/",
        description:
          "Displaying maps larger than the visible area by moving the viewport and culling off-screen tiles.",
      },
      // 4th
      //
      {
        title:
          "Tile & Floor type management - 2D Canvas & Javascript tile map tutorial #4",
        url: "https://www.youtube.com/watch?v=jWsUIDG2vAA",
        description:
          "In this tutorial we'll look at a better way to manage tile and floor types, and expand on the tile types we're currently using.",
      },
      {
        title: "More Tile Types for the Tile Map",
        url: "https://technologies4.me/articles/more-tile-types-map-a4/",
        description:
          "Making it simple to add more types of tiles to our map, and creating some helper functions for Character movement.",
      },
      // 5th
    ],
  },
];

let selectedGameScreen_ls = localStorage.getItem(selectedGameScreenLsKey);
/** @type {number|undefined} */
let selectedGameScreen;

if (selectedGameScreen_ls) {
  try {
    const temp = JSON.parse(selectedGameScreen_ls);
    if (typeof temp === "number" && !isNaN(temp)) {
      selectedGameScreen = temp;
    }
  } catch (e) {
    console.error("Error parsing selectedGameScreen from localStorage", e);
  }
}

let hasInitialScreen;
if (typeof selectedGameScreen !== "undefined") {
  hasInitialScreen = true;
  const { cb } = gameScreens[selectedGameScreen];
  if (cb) {
    document.startViewTransition(() => {
      cb();
    });
  } else {
    console.error("No callback found for selected game screen");
    localStorage.remove(selectedGameScreenLsKey);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.pathsCB = gameScreens;

let listItemsStr = "";
for (let i = 0; gameScreens.length > i; i++) {
  const { title } = gameScreens[i];
  listItemsStr += `<li><button onclick="localStorage.setItem('${selectedGameScreenLsKey}', ${i}) || pathsCB[${i}].cb()" class="${buttonPrimaryClassName}">${title}</button></li>`;
}

const baseScreen = /* html */ `
<section class="grid place-items-center min-h-[100dvh] max-w-screen-xl mx-auto p-8 text-center overflow-y-auto">
<ul class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] w-full">
	${listItemsStr}
</ul>
</section>
`;

if (!hasInitialScreen) {
  document.startViewTransition(() => {
    appElem.innerHTML = baseScreen;
  });
}
