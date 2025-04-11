import{CleanUpManager as m}from"../../libs/cleanup.js";import{loadManyImageElement as u,adjustCanvasDimensions as g}from"../../libs/dom.js";async function p(e){const n=`go-back-${`app-${Math.random().toString(32)}`}`;function r(){e.handleGoPrevScreen?.(),t.cleanUp()}const t=new m;e.appElem.innerHTML=`
	<section class="flex justify-center items-center p-12 text-lg">
		Loading assets...
	</section>
`;const[i,v]=await u([import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))]);if(i){console.error(i),e.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${e.handleGoPrevScreen?`<button id="${n}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,t.registerEventListener({elem:document.getElementById(n),type:"click",listener:r}),t.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",p(e)}});return}e.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${e.handleGoPrevScreen?`<button id="${n}">Go Back</button>`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
  </section>`,t.registerEventListener({elem:document.getElementById(n),type:"click",listener:r});const a=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!a)throw new Error("Couldn't find the canvas!");const o=a.getContext("2d"),[c,d]=g(a,o,600,600);let l;function s(){o.clearRect(0,0,c,d),l=requestAnimationFrame(s)}t.register(()=>{l&&cancelAnimationFrame(l)}),s()}export{p as default};
