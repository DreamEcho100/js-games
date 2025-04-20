import I from"../../libs/core/dom.js";import{adjustCanvas as C}from"../../libs/dom.js";import{generateSpriteAnimationStates as A}from"../../libs/sprite.js";import{reduceToString as j}from"../../libs/string.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/math.js";const F=await I({assetsInfo:[{type:"image",src:import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))}],stylesheetLink:import.meta.resolve("./__style.css",new URL(import.meta.url)),cb:({appId:p,assets:h,cleanUpManager:i,createLayout:v})=>{const y=`animations-${p}`,f=`animations-group-${p}`,[o]=h,w=o.naturalWidth,b=o.naturalHeight,s=w/12+2,g=b/10,a=A([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:s,height:g});let r="idle";const t={render:{width:500,height:700},dom:{}};v(`<canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${t.render.width}"
			height="${t.render.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div
			class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
			id="${f}"
		>
			<label for="animations">Choose an animation:</label>
			<!--
<select
				id="${y}"
				class="border border-solid border-black"
			>
				${Object.keys(a).map(e=>`<option value="${e}" >${e}</option>`).join("")}
			</select>
			-->
			<div
				class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
			>
				${j(Object.keys(a),e=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${e}" value="${e}" ${r===e?"checked":""} />
							<label for="${e}" class='ps-2'>${e}</label>
							</div>`)}
			</div>
		</div>`),document.getElementById(f)?.querySelectorAll("input[type='radio']").forEach(e=>{i.registerEventListener({elem:e,type:"change",listener:d=>{r=d.target.value,l=0}})});const m=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!m)throw new Error("Couldn't find the canvas!");const n=m.getContext("2d");if(!n)throw new Error("Couldn't get the canvas context!");const $=C({canvas:m,ctx:n,onUpdateCanvasSize:e=>{t.dom=e}});i.register($);let x=5,l=0,c;function u(){let e=Math.floor(l/x)%a[r].size;const d=s*e,S=a[r].locations[e].y;n.clearRect(0,0,t.render.width,t.render.height),n.drawImage(o,d,S,s,g,0,0,t.render.width,t.render.height),l++,c=requestAnimationFrame(u)}i.register(()=>{c&&cancelAnimationFrame(c)}),u()}});export{F as default};
