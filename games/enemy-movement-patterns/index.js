import H from"../../libs/core/dom.js";import{roundToPrecision as X,scale2dSizeToFit as T}from"../../libs/math.js";import{generateSpriteAnimationStates as W}from"../../libs/sprite.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";import"../../libs/dom.js";const z=await H({assetsInfo:[{type:"image",src:import.meta.resolve("./enemies/enemy1.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy2.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy3.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./enemies/enemy4.png",new URL(import.meta.url))}],cb:({assets:w,cleanUpManager:d,createLayout:P})=>{let e={width:500,height:700};P(`
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
			</fieldset>`);const l=document.getElementById("vanillaJavascriptSpriteAnimationTechniques"),S=document.querySelectorAll("input[name='enemyType']");if(!l)throw new Error("Couldn't find the canvas!");const r=l.getContext("2d");r.imageSmoothingEnabled=!0,r.imageSmoothingQuality="high";let s=0;const[x,y,A,E]=w;class I{constructor(a){this.img=a.img;const i=T({containerWidth:a.spriteRenderBaseWidth,sourceWidth:a.spriteMeta.width,sourceHeight:a.spriteMeta.height});this.width=i.width,this.height=i.height,this.spriteWidth=a.spriteMeta.width,this.spriteHeight=a.spriteMeta.height,this.x=Math.random()*(e.width-this.width),this.y=Math.random()*(e.height-this.height),this.currentFrameX=0,this.spriteAnimationStates=W(a.spriteAnimationStates,a.spriteMeta),this.currentAnimationState=a.currentAnimationState,this.speed=0,this.speedModifier=0,this.movePatternHandler=a.movePatternHandler,this.movePatternMeta=a.createMovePatternMeta?.({img:this.img,width:this.width,height:this.height,spriteWidth:this.spriteWidth,spriteHeight:this.spriteHeight,currentFrameX:this.currentFrameX,x:this.x,y:this.y})??{},a.onInitEnd?.(this)}update(){this.movePatternHandler(this);const a=this.spriteAnimationStates[this.currentAnimationState];s%this.speedModifier===0&&(this.currentFrameX=this.currentFrameX>=a.size-1?0:this.currentFrameX+1)}draw(){r.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),r.strokeRect(this.x,this.y,this.width,this.height)}}const c=6,g=6,M=6,p=9;function n(t){const a=t.spriteMeta??{width:X(t.img.naturalWidth/t.frames,2),height:t.img.naturalHeight};return{img:t.img,frames:t.frames,spriteAnimationStates:t.spriteAnimationStates,spriteMeta:a,currentAnimationState:t.currentAnimationState,createMovePatternMeta:t.createMovePatternMeta,movePatternHandler:t.movePatternHandler,onInitEnd:t.onInitEnd}}const h={enemy1:n({img:x,frames:c,spriteAnimationStates:[{name:"default",frames:c}],currentAnimationState:"default",createMovePatternMeta:()=>({}),movePatternHandler:t=>{t.x+=Math.random()*5-2.5,t.y+=Math.random()*5-2.5},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy2:n({img:y,frames:g,spriteAnimationStates:[{name:"default",frames:g}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*0,angleSpeed:Math.random()*.2,curveY:Math.random()*.7-.35,curveX:Math.random()*.7-.35}),movePatternHandler:t=>{t.x-=t.speed,t.y+=t.movePatternMeta.curveY*Math.sin(t.movePatternMeta.angle),t.movePatternMeta.angle+=t.movePatternMeta.angleSpeed,t.x+t.width<0&&(t.x=e.width,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy3:n({img:A,frames:M,spriteAnimationStates:[{name:"default",frames:M}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*500,angleSpeed:Math.random()*.5+.5,curveY:e.width/2,curveX:e.height/2}),movePatternHandler:t=>{t.x=t.movePatternMeta.curveX*Math.sin(t.movePatternMeta.angle*Math.PI/45)+(e.width/2-t.width/2),t.y=t.movePatternMeta.curveY*Math.cos(t.movePatternMeta.angle*Math.PI/135)+(e.height/2-t.height/2),t.movePatternMeta.angle+=t.movePatternMeta.angleSpeed,t.x+t.width<0&&(t.x=e.width,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1)}}),enemy4:n({img:E,frames:p,spriteAnimationStates:[{name:"default",frames:p}],currentAnimationState:"default",createMovePatternMeta:t=>({destinationX:Math.random()*(e.height-t.height),destinationY:Math.random()*(e.width-t.width),destinationFrameMoveInterval:Math.floor(Math.random()*30+10)}),movePatternHandler:t=>{s%t.movePatternMeta.destinationFrameMoveInterval===0&&(t.movePatternMeta.destinationX=Math.random()*(e.width-t.width),t.movePatternMeta.destinationY=Math.random()*(e.height-t.height));let a=t.movePatternMeta.destinationX-t.x,i=t.movePatternMeta.destinationY-t.y;t.x+=a*.05,t.y+=i*.05,t.x+t.width<0&&(t.x=e.width,t.x=e.width,t.y=Math.random()*e.height)},onInitEnd:t=>{t.speed=Math.random()*4+1,t.speedModifier=Math.floor(Math.random()*3+1),t.movePatternMeta.destinationFrameMoveInterval=Math.floor(Math.random()*30+10),t.movePatternMeta.destinationX=Math.random()*(e.width-t.width),t.movePatternMeta.destinationY=Math.random()*(e.height-t.height)}})},m=20,u=new Array(m);let F="enemy1";function v(t,a){for(let i=0;i<a;i++)u[i]=new I({...t,spriteRenderBaseWidth:120})}v(h[F],m),S.forEach(t=>{d.registerEventListener({elem:t,type:"change",listener:a=>{const i=a.target.value;if(!(i in h))throw new Error(`Enemy type "${i}" not found!`);const b=h[i];v(b,m)}})});let o;function f(){r.clearRect(0,0,e.width,e.height);for(const t of u)t.update(),t.draw();s++,o=requestAnimationFrame(f)}d.register(()=>{o&&cancelAnimationFrame(o)}),f()}});export{z as default};
