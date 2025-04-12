import{CleanUpManager as v}from"../../libs/cleanup.js";import{loadManyImageElement as M,adjustCanvasDimensions as A}from"../../libs/dom.js";import{scale2dSizeToFit as b}from"../../libs/math.js";import{generateSpriteAnimationStates as I}from"../../libs/sprite.js";async function E(t){const n=`go-back-${`app-${Math.random().toString(32)}`}`;function h(){t.handleGoPrevScreen?.(),a.cleanUp()}const a=new v;t.appElem.innerHTML=`
	<section class="flex justify-center items-center p-12 text-lg">
		Loading assets...
	</section>
`;const[c,S]=await M([import.meta.resolve("./enemies/enemy1.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy2.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy3.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy4.png",new URL(import.meta.url))]);if(c){console.error(c),t.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:h,silent:!1}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{t.appElem.innerHTML="",E(t)}});return}const r={width:600,height:600};t.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 size-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${t.handleGoPrevScreen?`<button id="${n}">Go Back</button>`:""}
    <small class="text-center"><em>In Progress</em></small>
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${r.width}"
      height="${r.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>
  </section>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:h,silent:!1});const m=document.getElementById("vanillaJavascriptSpriteAnimationTechniques");if(!m)throw new Error("Couldn't find the canvas!");const s=m.getContext("2d"),[d,g]=A(m,s,r.width,r.height);let p=0;const[l,L,B,H]=S;class x{constructor(e){this.x=Math.random()*d,this.y=Math.random()*g,this.img=e.img;const y=b({containerWidth:e.spriteScalingBaseWidth,sourceWidth:e.spriteMeta.width,sourceHeight:e.spriteMeta.height});this.width=y.width,this.height=y.height,this.spriteWidth=e.spriteMeta.width,this.spriteHeight=e.spriteMeta.height,this.currentFrameX=0,this.spriteAnimationStates=I(e.spriteAnimationStates,e.spriteMeta),this.currentAnimationState=e.currentAnimationState,this.speed=Math.random()*4-2,this.speedModifier=Math.floor(Math.random()*3+1)}update(){this.x+=this.speed,this.y+=this.speed;const e=this.spriteAnimationStates[this.currentAnimationState];p%this.speedModifier==0&&(this.currentFrameX=this.currentFrameX>=e.locations.length-1?0:this.currentFrameX+1)}draw(){s.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),s.strokeRect(this.x,this.y,this.width,this.height)}}const u=20,f=new Array(u);for(let i=0;i<u;i++)f[i]=new x({img:l,spriteAnimationStates:[{name:"default",frames:6}],spriteMeta:{width:l.naturalWidth/6,height:l.naturalHeight},currentAnimationState:"default",spriteScalingBaseWidth:120});let o;function w(){s.clearRect(0,0,d,g);for(const i of f)i.update(),i.draw();p++,o=requestAnimationFrame(w)}a.register(()=>{o&&cancelAnimationFrame(o)}),w()}export{E as default};
