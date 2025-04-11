import{CleanUpManager as A}from"../../libs/cleanup.js";import{injectStylesheetLink as L,loadManyImageElement as H,adjustCanvasDimensions as B}from"../../libs/dom.js";import{generateSpriteAnimationStates as C}from"../../libs/sprite.js";import{reduceToString as T}from"../../libs/string.js";async function M(t){const i=`app-${Math.random().toString(32)}`,n=`go-back-${i}`,k=`animations-${i}`,u=`animations-group-${i}`;function f(){t.handleGoPrevScreen?.(),a.cleanUp()}const a=new A;L(import.meta.resolve("./__style.css",new URL(import.meta.url)),a),t.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[y,I]=await H([import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))]);if(y){console.error(y),t.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:f}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{t.appElem.innerHTML="",M(t)}});return}const[o]=I,$=o.naturalWidth,E=o.naturalHeight,s=$/12+2,v=E/10,r=C([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:s,height:v});let l="idle";t.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button>`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
    <div
      class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
      id="${u}"
    >
      <label for="animations">Choose an animation:</label>
      <!--
<select
        id="${k}"
        class="border border-solid border-black"
      >
        ${Object.keys(r).map(e=>`<option value="${e}" >${e}</option>`).join("")}
      </select>
			-->
      <div
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
      >
        ${T(Object.keys(r),e=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${e}" value="${e}" ${l===e?"checked":""} />
							<label for="${e}" class='ps-2'>${e}</label>
							</div>`)}
      </div>
    </div>
  </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:f}),document.getElementById(u)?.querySelectorAll("input[type='radio']").forEach(e=>{a.registerEventListener({elem:e,type:"change",listener:p=>{l=p.target.value,d=0}})});const c=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!c)throw new Error("Couldn't find the canvas!");const m=c.getContext("2d"),[b,h]=B(c,m,600,600);let w=5,d=0,g;function x(){let e=Math.floor(d/w)%r[l].locations.length;const p=s*e,S=r[l].locations[e].y;m.clearRect(0,0,b,h),m.drawImage(o,p,S,s,v,0,0,b,h),d++,g=requestAnimationFrame(x)}a.register(()=>{g&&cancelAnimationFrame(g)}),x()}export{M as default};
