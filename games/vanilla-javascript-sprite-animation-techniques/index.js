import{CleanUpManager as S}from"../../libs/cleanup.js";import{injectStylesheetLink as L,loadManyImageElement as A}from"../../libs/dom.js";import{generateSpriteAnimationStates as B}from"../../libs/sprite.js";import{reduceToString as M}from"../../libs/string.js";async function H(t){const o=`app-${Math.random().toString(32)}`,r=`go-back-${o}`,x=`animations-${o}`,f=`animations-group-${o}`;function u(){t.handleGoPrevScreen?.(),a.cleanUp()}const a=new S;L(import.meta.resolve("./__style.css",new URL(import.meta.url)),a),t.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[p,w]=await A([import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))]);if(p){console.error(p),t.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${t.handleGoPrevScreen?`<button id="${r}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,a.registerEventListener({elem:document.getElementById(r),type:"click",listener:u,silent:!1}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{t.appElem.innerHTML="",H(t)}});return}const[s]=w,$=s.naturalWidth,k=s.naturalHeight,c=$/12+2,h=k/10,l=B([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:c,height:h});let i="idle";const n={width:600,height:600};t.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${t.handleGoPrevScreen?`<button id="${r}">Go Back</button>`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${n.width}"
      height="${n.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
    <div
      class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
      id="${f}"
    >
      <label for="animations">Choose an animation:</label>
      <!--
<select
        id="${x}"
        class="border border-solid border-black"
      >
        ${Object.keys(l).map(e=>`<option value="${e}" >${e}</option>`).join("")}
      </select>
			-->
      <div
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
      >
        ${M(Object.keys(l),e=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${e}" value="${e}" ${i===e?"checked":""} />
							<label for="${e}" class='ps-2'>${e}</label>
							</div>`)}
      </div>
    </div>
  </section>`,a.registerEventListener({elem:document.getElementById(r),type:"click",listener:u,silent:!1}),document.getElementById(f)?.querySelectorAll("input[type='radio']").forEach(e=>{a.registerEventListener({elem:e,type:"change",listener:g=>{i=g.target.value,m=0}})});const y=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!y)throw new Error("Couldn't find the canvas!");const v=y.getContext("2d");let E=5,m=0,d;function b(){let e=Math.floor(m/E)%l[i].locations.length;const g=c*e,I=l[i].locations[e].y;v.clearRect(0,0,n.width,n.height),v.drawImage(s,g,I,c,h,0,0,n.width,n.height),m++,d=requestAnimationFrame(b)}a.register(()=>{d&&cancelAnimationFrame(d)}),b()}export{H as default};
