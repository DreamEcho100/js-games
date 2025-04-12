import{CleanUpManager as L}from"../../libs/cleanup.js";import{injectStylesheetLink as C,loadManyImageElement as H,adjustCanvasDimensions as B}from"../../libs/dom.js";import{generateSpriteAnimationStates as T}from"../../libs/sprite.js";import{reduceToString as M}from"../../libs/string.js";async function j(t){const s=`app-${Math.random().toString(32)}`,n=`go-back-${s}`,w=`animations-${s}`,u=`animations-group-${s}`;function h(){t.handleGoPrevScreen?.(),a.cleanUp()}const a=new L;C(import.meta.resolve("./__style.css",new URL(import.meta.url)),a),t.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[y,k]=await H([import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))]);if(y){console.error(y),t.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:h,silent:!1}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{t.appElem.innerHTML="",j(t)}});return}const[o]=k,I=o.naturalWidth,E=o.naturalHeight,c=I/12+2,v=E/10,r=T([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:c,height:v});let i="idle";const l={width:600,height:600};t.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button>`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${l.width}"
      height="${l.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
    <div
      class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
      id="${u}"
    >
      <label for="animations">Choose an animation:</label>
      <!--
<select
        id="${w}"
        class="border border-solid border-black"
      >
        ${Object.keys(r).map(e=>`<option value="${e}" >${e}</option>`).join("")}
      </select>
			-->
      <div
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
      >
        ${M(Object.keys(r),e=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${e}" value="${e}" ${i===e?"checked":""} />
							<label for="${e}" class='ps-2'>${e}</label>
							</div>`)}
      </div>
    </div>
  </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:h,silent:!1}),document.getElementById(u)?.querySelectorAll("input[type='radio']").forEach(e=>{a.registerEventListener({elem:e,type:"change",listener:p=>{i=p.target.value,g=0}})});const m=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!m)throw new Error("Couldn't find the canvas!");const d=m.getContext("2d"),[b,x]=B(m,d,l.width,l.height);let S=5,g=0,f;function $(){let e=Math.floor(g/S)%r[i].locations.length;const p=c*e,A=r[i].locations[e].y;d.clearRect(0,0,b,x),d.drawImage(o,p,A,c,v,0,0,b,x),g++,f=requestAnimationFrame($)}a.register(()=>{f&&cancelAnimationFrame(f)}),$()}export{j as default};
