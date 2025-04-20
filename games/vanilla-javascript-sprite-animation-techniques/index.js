import I from"../../libs/core/dom.js";import{adjustCanvas as C}from"../../libs/dom.js";import{generateSpriteAnimationStates as A}from"../../libs/sprite.js";import{reduceToString as j}from"../../libs/string.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/math.js";const F=await I({assetsInfo:[{type:"image",src:import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))}],stylesheetLink:import.meta.resolve("./__style.css",new URL(import.meta.url)),cb:({appId:p,assets:u,cleanUpManager:n,createLayout:v})=>{const y=`animations-${p}`,g=`animations-group-${p}`,[o]=u,w=o.naturalWidth,b=o.naturalHeight,s=w/12+2,f=b/10,a=A([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:s,height:f});let r="idle",t={width:600,height:600};v(`<canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${t.width}"
			height="${t.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div
			class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
			id="${g}"
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
		</div>`),document.getElementById(g)?.querySelectorAll("input[type='radio']").forEach(e=>{n.registerEventListener({elem:e,type:"change",listener:d=>{r=d.target.value,m=0}})});const l=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!l)throw new Error("Couldn't find the canvas!");const i=l.getContext("2d");if(!i)throw new Error("Couldn't get the canvas context!");const $=C({canvas:l,ctx:i,onUpdateCanvasSize:e=>{t=e}});n.register($);let x=5,m=0,c;function h(){let e=Math.floor(m/x)%a[r].locations.length;const d=s*e,S=a[r].locations[e].y;i.clearRect(0,0,t.width,t.height),i.drawImage(o,d,S,s,f,0,0,t.width,t.height),m++,c=requestAnimationFrame(h)}n.register(()=>{c&&cancelAnimationFrame(c)}),h()}});export{F as default};
