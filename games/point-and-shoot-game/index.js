import m from"../../libs/core/dom.js";import{adjustCanvas as d}from"../../libs/dom.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/math.js";const p=await m({cb:({cleanUpManager:i,createLayout:o})=>{let t={width:500,height:700};o(`<small class='block text-center'><em>In Progress</em></small><canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${t.width}"
			height="${t.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>`);const e=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!e)throw new Error("Couldn't find the canvas!");const a=e.getContext("2d");if(!a)throw new Error("Couldn't get the canvas context!");const s=d({canvas:e,ctx:a,onUpdateCanvasSize:c=>{t=c}});i.register(s);let n;function r(){a.clearRect(0,0,t.width,t.height),n=requestAnimationFrame(r)}i.register(()=>{n&&cancelAnimationFrame(n)}),r()}});export{p as default};
