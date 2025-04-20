import X from"../../libs/core/dom.js";import{roundToPrecision as T,scale2dSizeToFit as W}from"../../libs/math.js";import{generateSpriteAnimationStates as R}from"../../libs/sprite.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/dom.js";const C=await X({assetsInfo:[{type:"image",src:import.meta.resolve("./enemies/enemy1.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy2.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy3.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy4.png",new URL(import.meta.url))}],cb:({assets:S,cleanUpManager:l,createLayout:P})=>{const e={width:600,height:600},n={inlineStart:0,inlineEnd:e.width};P(`
			<canvas
				id="vanillaJavascriptSpriteAnimationTechniques"
				width="${e.width}"
				height="${e.height}"
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
			</fieldset>`);const c=document.getElementById("vanillaJavascriptSpriteAnimationTechniques"),x=document.querySelectorAll("input[name='enemyType']");if(!c)throw new Error("Couldn't find the canvas!");const r=c.getContext("2d");r.imageSmoothingEnabled=!0,r.imageSmoothingQuality="high";let h=0;const[E,y,A,I]=S;class F{constructor(a){this.img=a.img;const i=W({containerWidth:a.spriteRenderBaseWidth,sourceWidth:a.spriteMeta.width,sourceHeight:a.spriteMeta.height});this.width=i.width,this.height=i.height,this.spriteWidth=a.spriteMeta.width,this.spriteHeight=a.spriteMeta.height,this.x=Math.random()*(e.width-this.width),this.y=Math.random()*(e.height-this.height),this.currentFrameX=0,this.spriteAnimationStates=R(a.spriteAnimationStates,a.spriteMeta),this.currentAnimationState=a.currentAnimationState,this.speed=0,this.speedModifier=0,this.movePatternHandler=a.movePatternHandler,this.movePatternMeta=a.createMovePatternMeta?.({img:this.img,width:this.width,height:this.height,spriteWidth:this.spriteWidth,spriteHeight:this.spriteHeight,currentFrameX:this.currentFrameX,x:this.x,y:this.y})??{},a.onInitEnd?.(this)}update(){this.movePatternHandler(this);const a=this.spriteAnimationStates[this.currentAnimationState];h%this.speedModifier===0&&(this.currentFrameX=this.currentFrameX>=a.locations.length-1?0:this.currentFrameX+1)}draw(){r.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),r.strokeRect(this.x,this.y,this.width,this.height)}}const g=6,M=6,p=6,u=9;function s(t){const a=t.spriteMeta??{width:T(t.img.naturalWidth/t.frames,2),height:t.img.naturalHeight};return{img:t.img,frames:t.frames,spriteAnimationStates:t.spriteAnimationStates,spriteMeta:a,currentAnimationState:t.currentAnimationState,createMovePatternMeta:t.createMovePatternMeta,movePatternHandler:t.movePatternHandler,onInitEnd:t.onInitEnd}}const o={enemy1:s({img:E,frames:g,spriteAnimationStates:[{name:"default",frames:g}],currentAnimationState:"default",createMovePatternMeta:()=>({}),movePatternHandler:t=>{t.x+=Math.random()*5-2.5,t.y+=Math.random()*5-2.5},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy2:s({img:y,frames:M,spriteAnimationStates:[{name:"default",frames:M}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*0,angleSpeed:Math.random()*.2,curveY:Math.random()*.7-.35,curveX:Math.random()*.7-.35}),movePatternHandler:t=>{t.x-=t.speed,t.y+=t.movePatternMeta.curveY*Math.sin(t.movePatternMeta.angle),t.movePatternMeta.angle+=t.movePatternMeta.angleSpeed,t.x+t.width<n.inlineStart&&(t.x=n.inlineEnd,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy3:s({img:A,frames:p,spriteAnimationStates:[{name:"default",frames:p}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*500,angleSpeed:Math.random()*.5+.5,curveY:e.width/2,curveX:e.height/2}),movePatternHandler:t=>{t.x=t.movePatternMeta.curveX*Math.sin(t.movePatternMeta.angle*Math.PI/45)+(e.width/2-t.width/2),t.y=t.movePatternMeta.curveY*Math.cos(t.movePatternMeta.angle*Math.PI/135)+(e.height/2-t.height/2),t.movePatternMeta.angle+=t.movePatternMeta.angleSpeed,t.x+t.width<n.inlineStart&&(t.x=n.inlineEnd,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy4:s({img:I,frames:u,spriteAnimationStates:[{name:"default",frames:u}],currentAnimationState:"default",createMovePatternMeta:t=>({destinationX:Math.random()*(e.height-t.height),destinationY:Math.random()*(e.width-t.width),destinationFrameMoveInterval:Math.floor(Math.random()*30+10)}),movePatternHandler:t=>{h%t.movePatternMeta.destinationFrameMoveInterval===0&&(t.movePatternMeta.destinationX=Math.random()*(e.width-t.width),t.movePatternMeta.destinationY=Math.random()*(e.height-t.height));let a=t.movePatternMeta.destinationX-t.x,i=t.movePatternMeta.destinationY-t.y;t.x+=a*.05,t.y+=i*.05,t.x+t.width<n.inlineStart&&(t.x=n.inlineEnd,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1),t.movePatternMeta.destinationFrameMoveInterval=Math.floor(Math.random()*30+10),t.movePatternMeta.destinationX=Math.random()*(e.width-t.width),t.movePatternMeta.destinationY=Math.random()*(e.height-t.height)}})},m=20,v=new Array(m);let b="enemy2";function f(t,a){for(let i=0;i<a;i++)v[i]=new F({...t,spriteRenderBaseWidth:120})}f(o[b],m),x.forEach(t=>{l.registerEventListener({elem:t,type:"change",listener:a=>{const i=a.target.value;if(!(i in o))throw new Error(`Enemy type "${i}" not found!`);const H=o[i];f(H,m)}})});let d;function w(){r.clearRect(0,0,e.width,e.height);for(const t of v)t.update(),t.draw();h++,d=requestAnimationFrame(w)}l.register(()=>{d&&cancelAnimationFrame(d)}),w()}});export{C as default};
