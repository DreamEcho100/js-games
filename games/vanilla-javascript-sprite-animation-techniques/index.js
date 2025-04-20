import S from"../../libs/core/dom.js";import{generateSpriteAnimationStates as I}from"../../libs/sprite.js";import{reduceToString as A}from"../../libs/string.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/dom.js";import"../../libs/math.js";const L=await S({assetsInfo:[{type:"image",src:import.meta.resolve("./shadow_dog.png",new URL(import.meta.url))}],stylesheetLink:import.meta.resolve("./__style.css",new URL(import.meta.url)),cb:({appId:m,assets:u,cleanUpManager:c,createLayout:y})=>{const v=`animations-${m}`,d=`animations-group-${m}`,[i]=u,w=i.naturalWidth,b=i.naturalHeight,n=w/12+2,p=b/10,a=I([{name:"idle",frames:7},{name:"jump",frames:7},{name:"fall",frames:7},{name:"run",frames:9},{name:"dizzy",frames:11},{name:"sit",frames:5},{name:"roll",frames:7},{name:"bite",frames:7},{name:"ko",frames:12},{name:"getHit",frames:4}],{width:n,height:p});let r="idle";const t={width:600,height:600};y(`<canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${t.width}"
			height="${t.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div
			class="flex flex-col gap-4 mt-8 grow overflow-y-auto text-center"
			id="${d}"
		>
			<label for="animations">Choose an animation:</label>
			<!--
<select
				id="${v}"
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
		</div>`),document.getElementById(d)?.querySelectorAll("input[type='radio']").forEach(e=>{c.registerEventListener({elem:e,type:"change",listener:l=>{r=l.target.value,o=0}})});const g=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!g)throw new Error("Couldn't find the canvas!");const f=g.getContext("2d");let $=5,o=0,s;function h(){let e=Math.floor(o/$)%a[r].locations.length;const l=n*e,x=a[r].locations[e].y;f.clearRect(0,0,t.width,t.height),f.drawImage(i,l,x,n,p,0,0,t.width,t.height),o++,s=requestAnimationFrame(h)}c.register(()=>{s&&cancelAnimationFrame(s)}),h()}});export{L as default};
