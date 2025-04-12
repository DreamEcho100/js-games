import{CleanUpManager as H}from"../../libs/cleanup.js";import{loadManyImageElement as T,adjustCanvasDimensions as U}from"../../libs/dom.js";import{clamp as A}from"../../libs/math.js";async function R(e){const i=`app-${Math.random().toString(32)}`,o=`go-back-${i}`,g=`canvas-${i}`,t=new H;function p(){e.handleGoPrevScreen?.(),t.cleanUp()}e.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[u,b]=await T([import.meta.resolve("./backgroundLayers/layer-1.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-2.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-3.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-4.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-5.png",new URL(import.meta.url))]);if(u){console.error(u),e.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${e.handleGoPrevScreen?`<button id="${o}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,t.registerEventListener({elem:document.getElementById(o),type:"click",listener:p,silent:!1}),t.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",R(e)}});return}const h=1,f=20;let a=5;const y=`showGameSpeed-${i}`,w=`gameSpeed-${i}`,l={width:800,height:700};e.appElem.innerHTML=`
	<section class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${e.handleGoPrevScreen?`<button id="${o}">Go Back</button>`:""}
		<canvas
			id="${g}"
			width="${l.width}"
			height="${l.height}"
			class="border-2 border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		></canvas>
		<div class="flex flex-col gap-4">
			<label>Game speed: <span id="${y}">${a}</span></label>
			<input type="range" id="${w}" min="${h}" max="${f}" value="${a}" />
		</div>
	</section>
	`;const v=document.getElementById(y),L=document.getElementById(w);t.registerEventListener({elem:L,type:"input",listener:s=>{a=A(Number(s.target.value),h,f),v.innerText=a.toString()}});const c=document.getElementById(g);if(!c)throw new Error("Couldn't find the canvas element!");const n=c.getContext("2d");if(!n)throw new Error("Couldn't get the canvas context!");t.registerEventListener({elem:document.getElementById(o),type:"click",listener:p,silent:!1});const[I,E]=U(c,n,l.width,l.height),[k,$,S,M,B]=b;class r{constructor(d,C){this.x1=0,this.y=0,this.width=d.naturalWidth,this.height=d.naturalHeight,this.img=d,this.speedModifier=C,this.speed=a*this.speedModifier}update(){this.speed=a*this.speedModifier,this.x1<=-this.width&&(this.x1=0),this.x1=Math.floor(this.x1-this.speed)}draw(){n.drawImage(this.img,this.x1,0),n.drawImage(this.img,this.x1+this.width,0)}}const G=[new r(k,.2),new r($,.4),new r(S,.6),new r(M,.8),new r(B,1)];let m;function x(){n.clearRect(0,0,I,E);for(const s of G)s.update(),s.draw();m=requestAnimationFrame(x)}t.register(()=>{m&&cancelAnimationFrame(m)}),x()}export{R as default};
