import{CleanUpManager as L}from"../../libs/cleanup.js";import{loadManyImageElement as B}from"../../libs/dom.js";import{scale2dSizeToFit as W}from"../../libs/math.js";import{roundToPrecision as $}from"../../libs/number.js";import{generateSpriteAnimationStates as R}from"../../libs/sprite.js";async function Y(i){const h=`go-back-${`app-${Math.random().toString(32)}`}`;function u(){i.handleGoPrevScreen?.(),r.cleanUp()}const r=new L;i.appElem.innerHTML=`
	<section class="flex justify-center items-center p-12 text-lg">
		Loading assets...
	</section>
`;const[M,y]=await B([import.meta.resolve("./enemies/enemy1.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy2.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy3.png",new URL(import.meta.url)),import.meta.resolve("./enemies/enemy4.png",new URL(import.meta.url))]);if(M){console.error(M),i.appElem.innerHTML=`<section
      class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
    >
      ${i.handleGoPrevScreen?`<button id="${h}">Go Back</button><br /><br />`:""}
      <p class="text-center">Couldn't load the image!</p>
      <button id="reload">Reload</button>
    </section>`,r.registerEventListener({elem:document.getElementById(h),type:"click",listener:u,silent:!1}),r.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{i.appElem.innerHTML="",Y(i)}});return}const t={width:600,height:600},s={inlineStart:0,inlineEnd:t.width};i.appElem.innerHTML=`<section
    class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
  >
    ${i.handleGoPrevScreen?`<button id="${h}">Go Back</button>`:""}
    <canvas
      id="vanillaJavascriptSpriteAnimationTechniques"
      width="${t.width}"
      height="${t.height}"
      class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
    ></canvas>

    <fieldset class="flex flex-wrap gap-4 justify-center items-center">
      <legend class="text-center font-medium">Choose Enemy Type</legend>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy1"
          class="accent-blue-500"
          checked
        />
        <span>Enemy 1</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy2"
          class="accent-blue-500"
        />
        <span>Enemy 2</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy3"
          class="accent-blue-500"
        />
        <span>Enemy 3</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="enemyType"
          value="enemy4"
          class="accent-blue-500"
        />
        <span>Enemy 4</span>
      </label>
    </fieldset>
  </section>`,r.registerEventListener({elem:document.getElementById(h),type:"click",listener:u,silent:!1});const p=document.getElementById("vanillaJavascriptSpriteAnimationTechniques"),b=document.querySelectorAll("input[name='enemyType']");if(!p)throw new Error("Couldn't find the canvas!");const o=p.getContext("2d");o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high";let m=0;const[A,I,H,F]=y;class T{constructor(a){this.img=a.img;const n=W({containerWidth:a.spriteScalingBaseWidth,sourceWidth:a.spriteMeta.width,sourceHeight:a.spriteMeta.height});this.width=n.width,this.height=n.height,this.spriteWidth=a.spriteMeta.width,this.spriteHeight=a.spriteMeta.height,this.x=Math.random()*(t.width-this.width),this.y=Math.random()*(t.height-this.height),this.currentFrameX=0,this.spriteAnimationStates=R(a.spriteAnimationStates,a.spriteMeta),this.currentAnimationState=a.currentAnimationState,this.speed=0,this.speedModifier=0,this.movePatternHandler=a.movePatternHandler,this.movePatternMeta=a.createMovePatternMeta?.({img:this.img,width:this.width,height:this.height,spriteWidth:this.spriteWidth,spriteHeight:this.spriteHeight,currentFrameX:this.currentFrameX,x:this.x,y:this.y})??{},a.onInitEnd?.(this)}update(){this.movePatternHandler(this);const a=this.spriteAnimationStates[this.currentAnimationState];m%this.speedModifier===0&&(this.currentFrameX=this.currentFrameX>=a.locations.length-1?0:this.currentFrameX+1)}draw(){o.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),o.strokeRect(this.x,this.y,this.width,this.height)}}const f=6,v=6,w=6,x=9;function l(e){const a=e.spriteMeta??{width:$(e.img.naturalWidth/e.frames,2),height:e.img.naturalHeight};return{img:e.img,frames:e.frames,spriteAnimationStates:e.spriteAnimationStates,spriteMeta:a,currentAnimationState:e.currentAnimationState,createMovePatternMeta:e.createMovePatternMeta,movePatternHandler:e.movePatternHandler,onInitEnd:e.onInitEnd}}const d={enemy1:l({img:A,frames:f,spriteAnimationStates:[{name:"default",frames:f}],currentAnimationState:"default",createMovePatternMeta:()=>({}),movePatternHandler:e=>{e.x+=Math.random()*5-2.5,e.y+=Math.random()*5-2.5},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy2:l({img:I,frames:v,spriteAnimationStates:[{name:"default",frames:v}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*0,angleSpeed:Math.random()*.2,curveY:Math.random()*.7-.35,curveX:Math.random()*.7-.35}),movePatternHandler:e=>{e.x-=e.speed,e.y+=e.movePatternMeta.curveY*Math.sin(e.movePatternMeta.angle),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<s.inlineStart&&(e.x=s.inlineEnd,e.x=t.width,e.y=Math.random()*t.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy3:l({img:H,frames:w,spriteAnimationStates:[{name:"default",frames:w}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*500,angleSpeed:Math.random()*.5+.5,curveY:t.width/2,curveX:t.height/2}),movePatternHandler:e=>{e.x=e.movePatternMeta.curveX*Math.sin(e.movePatternMeta.angle*Math.PI/45)+(t.width/2-e.width/2),e.y=e.movePatternMeta.curveY*Math.cos(e.movePatternMeta.angle*Math.PI/135)+(t.height/2-e.height/2),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<s.inlineStart&&(e.x=s.inlineEnd,e.x=t.width,e.y=Math.random()*t.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy4:l({img:F,frames:x,spriteAnimationStates:[{name:"default",frames:x}],currentAnimationState:"default",createMovePatternMeta:e=>({destinationX:Math.random()*(t.height-e.height),destinationY:Math.random()*(t.width-e.width),destinationFrameMoveInterval:Math.floor(Math.random()*30+10)}),movePatternHandler:e=>{m%e.movePatternMeta.destinationFrameMoveInterval===0&&(e.movePatternMeta.destinationX=Math.random()*(t.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.height-e.height));let a=e.movePatternMeta.destinationX-e.x,n=e.movePatternMeta.destinationY-e.y;e.x+=a*.05,e.y+=n*.05,e.x+e.width<s.inlineStart&&(e.x=s.inlineEnd,e.x=t.width,e.y=Math.random()*t.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1),e.movePatternMeta.destinationFrameMoveInterval=Math.floor(Math.random()*30+10),e.movePatternMeta.destinationX=Math.random()*(t.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.height-e.height)}})},c=20,S=new Array(c);let k="enemy2";function P(e,a){for(let n=0;n<a;n++)S[n]=new T({...e,spriteScalingBaseWidth:120})}P(d[k],c),b.forEach(e=>{r.registerEventListener({elem:e,type:"change",listener:a=>{const n=a.target.value;if(!(n in d))throw new Error(`Enemy type "${n}" not found!`);const X=d[n];P(X,c)}})});let g;function E(){o.clearRect(0,0,t.width,t.height);for(const e of S)e.update(),e.draw();m++,g=requestAnimationFrame(E)}r.register(()=>{g&&cancelAnimationFrame(g)}),E()}export{Y as default};
