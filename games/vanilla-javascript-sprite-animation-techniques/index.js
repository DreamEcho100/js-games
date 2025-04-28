import S from"../../libs/core/dom.js";import{adjustCanvas as j}from"../../libs/dom/index.js";import{generateSpriteAnimationStates as k}from"../../libs/sprite.js";import{reduceToString as A}from"../../libs/string.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/math.js";const W=await S({assetsInfo:[{type:"image",src:import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))}],stylesheetLink:import.meta.resolve("./__style.css",new URL(import.meta.url)),cb:({appId:o,assets:v,cleanupManager:i,createLayout:y})=>{const g=`${o}-canvas`,w=`${o}-animations`,p=`${o}-animations-group`,[s]=v,$=s.naturalWidth,b=s.naturalHeight,m=$/12+2,h=b/10,a=k([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:m,height:h});let r="idle";const t={render:{width:600,height:600},dom:{}};y(`<canvas
			id="${g}"
			width="${t.render.width}"
			height="${t.render.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 mx-auto max-w-full w-5xl"
		></canvas>
		<div
			class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
			id="${p}"
		>
			<label for="animations">Choose an animation:</label>
			<!--
<select
				id="${w}"
				class="border border-solid border-black"
			>
				${Object.keys(a).map(e=>`<option value="${e}" >${e}</option>`).join("")}
			</select>
			-->
			<div
				class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 capitalize"
			>
				${A(Object.keys(a),e=>`<div class="flex items-center w-fit">
						<input type="radio" name="animations" id="${e}" value="${e}" ${r===e?"checked":""} />
							<label for="${e}" class='ps-2'>${e}</label>
							</div>`)}
			</div>
		</div>`),document.getElementById(p)?.querySelectorAll("input[type='radio']").forEach(e=>{i.registerEventListener({elem:e,type:"change",listener:f=>{r=f.target.value,c=0}})});const l=document.getElementById(g);if(!l)throw new Error("Couldn't find the canvas!");const n=l.getContext("2d");if(!n)throw new Error("Couldn't get the canvas context!");const x=j({canvas:l,ctx:n,onUpdateCanvasSize:e=>{t.dom=e}});i.register(x);let C=5,c=0,d;function u(){let e=Math.floor(c/C)%a[r].size;const f=m*e,I=a[r].locations[e].y;n.clearRect(0,0,t.render.width,t.render.height),n.drawImage(s,f,I,m,h,0,0,t.render.width,t.render.height),c++,d=requestAnimationFrame(u)}i.register(()=>{d&&cancelAnimationFrame(d)}),u()}});export{W as default};
