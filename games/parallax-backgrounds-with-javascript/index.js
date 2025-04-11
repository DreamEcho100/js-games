import{CleanUpManager as H}from"../../libs/cleanup.js";import{loadManyImageElement as T,adjustCanvasDimensions as U}from"../../libs/dom.js";import{clampValue as A}from"../../libs/number.js";async function R(e){const s=`app-${Math.random().toString(32)}`,o=`go-back-${s}`,m=`canvas-${s}`,t=new H;function g(){e.handleGoPrevScreen?.(),t.cleanUp()}e.appElem.innerHTML=`
  <section class="flex justify-center items-center p-12 text-lg">
    Loading assets...
  </section>
`;const[p,b]=await T([import.meta.resolve("./backgroundLayers/layer-1.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-2.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-3.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-4.png",new URL(import.meta.url)),import.meta.resolve("./backgroundLayers/layer-5.png",new URL(import.meta.url))]);if(p){console.error(p),e.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${e.handleGoPrevScreen?`<button id="${o}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,t.registerEventListener({elem:document.getElementById(o),type:"click",listener:g}),t.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",R(e)}});return}const u=1,h=20;let a=5;const y=`showGameSpeed-${s}`,f=`gameSpeed-${s}`;e.appElem.innerHTML=`
	<section class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${e.handleGoPrevScreen?`<button id="${o}">Go Back</button>`:""}
		<canvas id="${m}" width="800" height="700" class="border-2 border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
		style="aspect-ratio: 800 / 700; width: 800px; height: 700px"
		></canvas>
		<div class="flex flex-col gap-4">
			<label>Game speed: <span id="${y}">${a}</span></label>
			<input type="range" id="${f}" min="${u}" max="${h}" value="${a}" />
		</div>
	</section>
	`;const v=document.getElementById(y),L=document.getElementById(f);t.registerEventListener({elem:L,type:"input",listener:i=>{a=A(Number(i.target.value),u,h),v.innerText=a.toString()}});const d=document.getElementById(m);if(!d)throw new Error("Couldn't find the canvas element!");const n=d.getContext("2d");if(!n)throw new Error("Couldn't get the canvas context!");t.registerEventListener({elem:document.getElementById(o),type:"click",listener:g});const x={width:800,height:700},[I,E]=U(d,n,x.width,x.height),[k,S,$,M,B]=b;class r{constructor(l,C){this.x1=0,this.y=0,this.width=l.naturalWidth,this.height=l.naturalHeight,this.img=l,this.speedModifier=C,this.speed=a*this.speedModifier}update(){this.speed=a*this.speedModifier,this.x1<=-this.width&&(this.x1=0),this.x1=Math.floor(this.x1-this.speed)}draw(){n.drawImage(this.img,this.x1,0),n.drawImage(this.img,this.x1+this.width,0)}}const G=[new r(k,.2),new r(S,.4),new r($,.6),new r(M,.8),new r(B,1)];let c;function w(){n.clearRect(0,0,I,E);for(const i of G)i.update(),i.draw();c=requestAnimationFrame(w)}t.register(()=>{c&&cancelAnimationFrame(c)}),w()}export{R as default};
