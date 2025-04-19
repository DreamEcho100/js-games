import d from"../../libs/core/dom.js";import{generateSpriteAnimationStates as g}from"../../libs/sprite.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/dom.js";const I=await d({assetsUrls:[import.meta.resolve("./boom.png",new URL(import.meta.url))],cb:({assets:o,cleanUpManager:r,createLayout:s})=>{const[a]=o,m=a.naturalWidth,c=a.naturalHeight,l=m/5;g([{name:"default",frames:5}],{width:l,height:c});const e={width:600,height:600};s(`<small class='block text-center'><em>In Progress</em></small><canvas
			id="vanillaJavascriptSpriteAnimationTechniques"
			width="${e.width}"
			height="${e.height}"
			class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>`);const i=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!i)throw new Error("Couldn't find the canvas!");const h=i.getContext("2d");let t;function n(){h.clearRect(0,0,e.width,e.height),t=requestAnimationFrame(n)}r.register(()=>{t&&cancelAnimationFrame(t)}),n()}});export{I as default};
