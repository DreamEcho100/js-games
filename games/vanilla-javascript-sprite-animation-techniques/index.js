import{addStyleSheetLinkToHead as I,createImage as S,buildSpriteAnimationsStates as k}from"../../utils/index.js";async function E(o){const r=`app-${Math.random().toString(32)}`,m=`go-back-${r}`,h=`animations-${r}`,d=`animations-group-${r}`,v=I(import.meta.resolve("./__style.css",new URL(import.meta.url))),{image:b,sourceWidth:y,sourceHeight:w}=await S(import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))),i=y/12+2,p=w/10,t=k([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:i,height:p});let a="idle";o.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${o.handleGoPrevScreen?`<button id="${m}">Go Back</button><br /><br />`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="600"
      height="600"
      class="border border-solid border-black w-full aspect-square max-size-[37.5rem] mx-auto"
    ></canvas>
    <div
      class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
      id="${d}"
    >
      <label for="animations">Choose an animation:</label>
      <!--
<select
        id="${h}"
        class="border border-solid border-black"
      >
        ${Object.keys(t).map(e=>`<option value="${e}" >${e}</option>`).join("")}
      </select>
			-->
      <div
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
      >
        ${Object.keys(t).map(e=>`<div class="flex items-center w-fit">
				<input type="radio" name="animations" id="${e}" value="${e}" ${a===e?"checked":""} />
					<label for="${e}" class='ps-2'>${e}</label>
					</div>`).join("")}
      </div>
    </div>
  </section>`,document.getElementById(d)?.querySelectorAll("input[type='radio']").forEach(e=>{e.addEventListener("change",c=>{a=c.target.value,l=0})}),document.getElementById(m)?.addEventListener("click",()=>{o.handleGoPrevScreen?.(),v.remove()});const n=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!n)throw new Error("Couldn't find the canvas!");const s=n.getContext("2d"),u=n.width=600,f=n.height=600;if(!s)throw new Error("Couldn't find the `ctx`!");let x=5,l=0;function g(){let e=Math.floor(l/x)%t[a].locations.length;const c=i*e,$=t[a].locations[e].y;s.clearRect(0,0,u,f),s.drawImage(b,c,$,i,p,0,0,u,f),l++,requestAnimationFrame(g)}g()}export{E as default};
