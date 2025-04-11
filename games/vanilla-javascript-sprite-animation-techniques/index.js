async function k(e){return new Promise(n=>{const i=new Image;i.onload=function(t){const a=t.target;if("naturalHeight"in a&&"naturalWidth"in a&&(a.naturalHeight+a.naturalWidth===0||a.width+a.height===0)){n([new Error("Image has no dimensions"),null]);return}n([null,i])},i.onerror=function(t){const a=t instanceof Error?t.message:typeof t=="string"?t:`Error loading as image: ${e}`;n([new Error(`Failed to load image at ${e}: ${a}`),null])},i.src=e})}async function S(e){const n=await Promise.all(e.map(async t=>{const[a,l]=await k(t);return a?[new Error(`Failed to preload ${t}: ${a.message}`),null]:[null,l]})),i=new Array(n.length);for(let t=0;t<n.length;t++){const[a,l]=n[t];if(a)return[a,null];i[t]=l}return[null,i]}function A(e){const n=document.createElement("link");return n.rel="stylesheet",n.type="text/css",n.href=e,document.head.appendChild(n),n}function H(e,n,i,t){const a=window.devicePixelRatio||1;return e.width=i*a,e.height=t*a,e.style.width=`${i}px`,e.style.height=`${t}px`,n.scale(a,a),[e.width,e.height]}function L(e,n){const i={};for(let t=0;t<e.length;t++){const a=e[t],l=i[a.name]={locations:new Array(a.frames)};if(n.width<=0||n.height<=0)throw new Error("Sprite dimensions must be positive numbers.");for(let r=0;r<a.frames;r++)l.locations[r]={x:(n.width+(n.offsetX??0))*r,y:(n.height+(n.offsetY??0))*t}}return i}function C(e,n){let i="";for(let t=0;t<e.length;t++)i+=n(e[t],t,e);return i}async function T(e){const n=`app-${Math.random().toString(32)}`,i=`go-back-${n}`,t=`animations-${n}`,a=`animations-group-${n}`,l=A(import.meta.resolve("./__style.css",new URL(import.meta.url)));e.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[r,x]=await S([import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))]);if(r){console.error(r),e.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${e.handleGoPrevScreen?`<button id="${i}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,document.getElementById(i)?.addEventListener("click",()=>{e.handleGoPrevScreen?.(),l.remove()}),document.getElementById("reload")?.addEventListener("click",()=>{e.appElem.innerHTML="",T(e)});return}const[m]=x,v=m.naturalWidth,E=m.naturalHeight,d=v/12+2,p=E/10,s=L([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:d,height:p});let c="idle";e.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${e.handleGoPrevScreen?`<button id="${i}">Go Back</button><br /><br />`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-black aspect-square size-[37.5rem] max-w-full mx-auto"
    ></canvas>
    <div
      class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
      id="${a}"
    >
      <label for="animations">Choose an animation:</label>
      <!--
<select
        id="${t}"
        class="border border-solid border-black"
      >
        ${Object.keys(s).map(o=>`<option value="${o}" >${o}</option>`).join("")}
      </select>
			-->
      <div
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
      >
        ${C(Object.keys(s),o=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${o}" value="${o}" ${c===o?"checked":""} />
							<label for="${o}" class='ps-2'>${o}</label>
							</div>`)}
      </div>
    </div>
  </section>`,document.getElementById(a)?.querySelectorAll("input[type='radio']").forEach(o=>{o.addEventListener("change",h=>{c=h.target.value,g=0})}),document.getElementById(i)?.addEventListener("click",()=>{e.handleGoPrevScreen?.(),l.remove()});const u=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!u)throw new Error("Couldn't find the canvas!");const f=u.getContext("2d"),[y,w]=H(u,f,600,600);let $=5,g=0;function b(){let o=Math.floor(g/$)%s[c].locations.length;const h=d*o,I=s[c].locations[o].y;f.clearRect(0,0,y,w),f.drawImage(m,h,I,d,p,0,0,y,w),g++,requestAnimationFrame(b)}b()}export{T as default};
