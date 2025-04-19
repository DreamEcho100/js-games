import{CleanUpManager as G}from"../../libs/cleanup.js";import{loadManyImageElement as U}from"../../libs/dom.js";import{clamp as R}from"../../libs/math.js";async function T(e){const i=`app-${Math.random().toString(32)}`,s=`go-back-${i}`,m=`canvas-${i}`,t=new G;function g(){e.handleGoPrevScreen?.(),t.cleanUp()}e.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[p,b]=await U([import.meta.resolve("./backgroundLayers/layer-1.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-2.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-3.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-4.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-5.png",new URL(import.meta.url))]);if(p){console.error(p),e.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${e.handleGoPrevScreen?`<button id="${s}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,t.registerEventListener({elem:document.getElementById(s),type:"click",listener:g,silent:!1}),t.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",T(e)}});return}const u=1,h=20;let a=5;const f=`showGameSpeed-${i}`,y=`gameSpeed-${i}`,l={width:800,height:700};e.appElem.innerHTML=`
	<section class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${e.handleGoPrevScreen?`<button id="${s}">Go Back</button>`:""}
		<canvas
			id="${m}"
			width="${l.width}"
			height="${l.height}"
			class="border-2 border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div class="flex flex-col gap-4">
			<label>Game speed: <span id="${f}">${a}</span></label>
			<input type="range" id="${y}" min="${u}" max="${h}" value="${a}" />
		</div>
	</section>
	`;const v=document.getElementById(f),L=document.getElementById(y);t.registerEventListener({elem:L,type:"input",listener:r=>{a=R(Number(r.target.value),u,h),v.innerText=a.toString()}});const w=document.getElementById(m);if(!w)throw new Error("Couldn't find the canvas element!");const o=w.getContext("2d");if(!o)throw new Error("Couldn't get the canvas context!");t.registerEventListener({elem:document.getElementById(s),type:"click",listener:g,silent:!1});const[I,k,E,$,S]=b;class n{constructor(d,B){this.x1=0,this.y=0,this.width=d.naturalWidth,this.height=d.naturalHeight,this.img=d,this.speedModifier=B,this.speed=a*this.speedModifier}update(){this.speed=a*this.speedModifier,this.x1<=-this.width&&(this.x1=0),this.x1=Math.floor(this.x1-this.speed)}draw(){o.drawImage(this.img,this.x1,0),o.drawImage(this.img,this.x1+this.width,0)}}const M=[new n(I,.2),new n(k,.4),new n(E,.6),new n($,.8),new n(S,1)];let c;function x(){o.clearRect(0,0,l.width,l.height);for(const r of M)r.update(),r.draw();c=requestAnimationFrame(x)}t.register(()=>{c&&cancelAnimationFrame(c)}),x()}export{T as default};
